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
from app.core.dependencies import get_current_user, require_teacher

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.get("", response_model=List[QuizOut])
def list_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        item = QuizOut.model_validate(q)
        item.question_count = len(q.questions)
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

    # If teacher, return full details including correct answers
    if current_user.role == "TEACHER":
        out = QuizDetailTeacherOut.model_validate(quiz)
        out.question_count = len(quiz.questions)
        return out

    # If student, return without is_correct
    out = QuizDetailOut.model_validate(quiz)
    out.question_count = len(quiz.questions)
    return out

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
        author_id=teacher.id
    )
    db.add(quiz)
    db.flush()

    for q_idx, q_data in enumerate(quiz_in.questions):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            code_snippet=q_data.code_snippet,
            explanation=q_data.explanation,
            order=q_idx + 1
        )
        db.add(question)
        db.flush()

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

    total_questions = len(quiz.questions)
    correct_count = 0
    results: List[QuestionResultOut] = []

    for q in quiz.questions:
        selected_opt_id = submission.answers.get(q.id) or submission.answers.get(str(q.id))
        correct_opt = next((opt for opt in q.options if opt.is_correct), None)
        correct_opt_id = correct_opt.id if correct_opt else -1

        is_correct = selected_opt_id is not None and selected_opt_id == correct_opt_id
        if is_correct:
            correct_count += 1

        results.append(QuestionResultOut(
            question_id=q.id,
            question_text=q.question_text,
            code_snippet=q.code_snippet,
            selected_option_id=selected_opt_id,
            correct_option_id=correct_opt_id,
            is_correct=is_correct,
            explanation=q.explanation,
            options=[QuizOptionOut.model_validate(opt) for opt in q.options]
        ))

    score = correct_count
    percentage = round((score / total_questions * 100), 1) if total_questions > 0 else 0.0

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=total_questions,
        time_spent_seconds=submission.time_spent_seconds,
        user_answers={str(k): v for k, v in submission.answers.items()}
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
        item.percentage = round((att.score / att.total_questions * 100), 1) if att.total_questions > 0 else 0.0
        results.append(item)
    return results
