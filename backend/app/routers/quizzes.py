from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuizCreate,
    QuizOut,
    QuizDetailOut,
    QuizDetailTeacherOut,
    QuizSubmitIn,
    QuizSubmitResult,
    QuestionResultOut,
    QuizOptionOut,
    QuizAttemptOut,
)
from app.core.dependencies import get_current_user, require_teacher, get_current_user_optional

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.get("", response_model=List[QuizOut])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Quiz).order_by(Quiz.created_at.desc())
    # If student or unauthenticated, only show assigned quizzes
    if not current_user or current_user.role != "TEACHER":
        query = query.filter(Quiz.is_assigned == True)

    quizzes = query.all()
    results = []
    for q in quizzes:
        item = QuizOut.model_validate(q)
        item.question_count = len(q.questions)
        item.attempt_count = len(q.attempts)
        results.append(item)
    return results

@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm")

    # If student, check if quiz is assigned
    if current_user.role != "TEACHER" and not quiz.is_assigned:
        raise HTTPException(
            status_code=403,
            detail="Bài trắc nghiệm này chưa được giáo viên mở cho học viên làm!"
        )

    # If teacher, return full details including correct answers
    if current_user.role == "TEACHER":
        out = QuizDetailTeacherOut.model_validate(quiz)
        out.question_count = len(quiz.questions)
        return out

    # If student, return without is_correct
    out = QuizDetailOut.model_validate(quiz)
    out.question_count = len(quiz.questions)
    return out

@router.patch("/{quiz_id}/toggle-assign", response_model=QuizOut)
def toggle_assign_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm")

    quiz.is_assigned = not bool(quiz.is_assigned)
    db.commit()
    db.refresh(quiz)

    item = QuizOut.model_validate(quiz)
    item.question_count = len(quiz.questions)
    return item

@router.post("", response_model=QuizDetailTeacherOut)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        time_limit_minutes=quiz_in.time_limit_minutes,
        is_assigned=quiz_in.is_assigned,
        author_id=teacher.id
    )
    db.add(quiz)
    db.flush()

    for q_idx, q_data in enumerate(quiz_in.questions):
        # Automatically mark as PRACTICE if test cases exist, or if explicitly PRACTICE
        q_type = q_data.question_type or "THEORY"
        if q_data.test_cases and len(q_data.test_cases) > 0:
            q_type = "PRACTICE"

        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            question_type=q_type,
            code_snippet=q_data.code_snippet,
            explanation=q_data.explanation,
            test_cases=q_data.test_cases or [],
            order=q_idx + 1
        )
        db.add(question)
        db.flush()

        # Only create options if provided (theory questions)
        if q_data.options:
            for opt_idx, opt_data in enumerate(q_data.options):
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct,
                    order=opt_idx + 1
                )
                db.add(option)

    db.commit()
    db.refresh(quiz)
    out = QuizDetailTeacherOut.model_validate(quiz)
    out.question_count = len(quiz.questions)
    return out

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm")
    db.delete(quiz)
    db.commit()
    return {"message": "Đã xóa bài trắc nghiệm thành công"}

@router.post("/{quiz_id}/submit", response_model=QuizSubmitResult)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm")

    if current_user.role != "TEACHER" and not quiz.is_assigned:
        raise HTTPException(
            status_code=403,
            detail="Bài trắc nghiệm này chưa được giáo viên mở cho học viên làm!"
        )

    total_questions = len(quiz.questions)
    correct_count = 0
    results: List[QuestionResultOut] = []

    for q in quiz.questions:
        q_type = getattr(q, 'question_type', None)
        if not q_type:
            q_type = "PRACTICE" if (q.test_cases and len(q.test_cases) > 0) else "THEORY"

        if q_type == "PRACTICE":
            # Practical question evaluated via practice_answers
            p_data = (submission.practice_answers or {}).get(q.id) or (submission.practice_answers or {}).get(str(q.id)) or {}
            is_correct = bool(p_data.get("passed", False))
            student_code = p_data.get("code", "")
            tests_passed = p_data.get("passed_count", 0)
            total_tests = p_data.get("total_count", len(q.test_cases or []))

            if is_correct:
                correct_count += 1

            results.append(QuestionResultOut(
                question_id=q.id,
                question_text=q.question_text,
                question_type="PRACTICE",
                code_snippet=q.code_snippet,
                selected_option_id=None,
                correct_option_id=None,
                is_correct=is_correct,
                explanation=q.explanation,
                student_code=student_code,
                tests_passed=tests_passed,
                total_tests=total_tests,
                options=[]
            ))
        else:
            # Theory question evaluated via ABCD answers
            selected_opt_id = submission.answers.get(q.id) or submission.answers.get(str(q.id))
            if isinstance(selected_opt_id, dict):
                selected_opt_id = None
            else:
                try:
                    selected_opt_id = int(selected_opt_id) if selected_opt_id is not None else None
                except (ValueError, TypeError):
                    selected_opt_id = None

            correct_opt = next((opt for opt in q.options if opt.is_correct), None)
            correct_opt_id = correct_opt.id if correct_opt else -1

            is_correct = selected_opt_id is not None and selected_opt_id == correct_opt_id
            if is_correct:
                correct_count += 1

            results.append(QuestionResultOut(
                question_id=q.id,
                question_text=q.question_text,
                question_type="THEORY",
                code_snippet=q.code_snippet,
                selected_option_id=selected_opt_id,
                correct_option_id=correct_opt_id,
                is_correct=is_correct,
                explanation=q.explanation,
                student_code=None,
                tests_passed=None,
                total_tests=None,
                options=[QuizOptionOut.model_validate(opt) for opt in q.options]
            ))

    score = correct_count
    percentage = round((score / total_questions * 100), 1) if total_questions > 0 else 0.0

    results_dict = [
        r.model_dump() if hasattr(r, 'model_dump') else r.dict()
        for r in results
    ]

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=total_questions,
        time_spent_seconds=submission.time_spent_seconds,
        user_answers={
            "answers": {str(k): v for k, v in submission.answers.items()},
            "practice_answers": submission.practice_answers or {},
            "results": results_dict
        }
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizSubmitResult(
        attempt_id=attempt.id,
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        time_spent_seconds=submission.time_spent_seconds,
        results=results
    )

@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptOut])
def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id)
    if current_user.role == "STUDENT":
        query = query.filter(QuizAttempt.user_id == current_user.id)

    attempts = query.order_by(QuizAttempt.created_at.desc()).all()
    results = []
    for att in attempts:
        item = QuizAttemptOut.model_validate(att)
        item.user_name = att.user.full_name if att.user else "Ẩn danh"
        item.user_email = att.user.email if att.user else ""
        item.percentage = round((att.score / att.total_questions * 100), 1) if att.total_questions > 0 else 0.0
        results.append(item)
    return results

@router.get("/{quiz_id}/attempts/{attempt_id}", response_model=QuizAttemptOut)
def get_quiz_attempt_detail(
    quiz_id: int,
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.quiz_id == quiz_id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm này")

    if current_user.role != "TEACHER" and attempt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem bài làm này")

    item = QuizAttemptOut.model_validate(attempt)
    item.user_name = attempt.user.full_name if attempt.user else "Ẩn danh"
    item.user_email = attempt.user.email if attempt.user else ""
    item.percentage = round((attempt.score / attempt.total_questions * 100), 1) if attempt.total_questions > 0 else 0.0

    raw_data = attempt.user_answers or {}
    if isinstance(raw_data, dict) and "results" in raw_data and raw_data["results"]:
        item.results = [QuestionResultOut(**r) for r in raw_data["results"]]
    else:
        # Reconstruct for older attempts
        quiz = attempt.quiz
        reconstructed = []
        answers_dict = raw_data.get("answers", raw_data) if isinstance(raw_data, dict) else {}
        practice_dict = raw_data.get("practice_answers", {}) if isinstance(raw_data, dict) else {}
        for q in quiz.questions:
            q_type = getattr(q, 'question_type', None)
            if not q_type:
                q_type = "PRACTICE" if (q.test_cases and len(q.test_cases) > 0) else "THEORY"

            if q_type == "PRACTICE":
                p_item = practice_dict.get(str(q.id)) or practice_dict.get(q.id) or {}
                reconstructed.append(QuestionResultOut(
                    question_id=q.id,
                    question_text=q.question_text,
                    question_type="PRACTICE",
                    code_snippet=q.code_snippet,
                    selected_option_id=None,
                    correct_option_id=None,
                    is_correct=bool(p_item.get("passed", False)),
                    explanation=q.explanation,
                    student_code=p_item.get("code", ""),
                    tests_passed=p_item.get("passed_count", 0),
                    total_tests=p_item.get("total_count", len(q.test_cases or [])),
                    options=[]
                ))
            else:
                sel_opt_id = answers_dict.get(str(q.id)) or answers_dict.get(q.id)
                try:
                    sel_opt_id = int(sel_opt_id) if sel_opt_id is not None else None
                except (ValueError, TypeError):
                    sel_opt_id = None
                corr_opt = next((opt for opt in q.options if opt.is_correct), None)
                corr_opt_id = corr_opt.id if corr_opt else -1
                reconstructed.append(QuestionResultOut(
                    question_id=q.id,
                    question_text=q.question_text,
                    question_type="THEORY",
                    code_snippet=q.code_snippet,
                    selected_option_id=sel_opt_id,
                    correct_option_id=corr_opt_id,
                    is_correct=sel_opt_id is not None and sel_opt_id == corr_opt_id,
                    explanation=q.explanation,
                    options=[QuizOptionOut.model_validate(opt) for opt in q.options]
                ))
        item.results = reconstructed

    return item

