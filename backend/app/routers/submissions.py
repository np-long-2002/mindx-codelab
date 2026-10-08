from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import Submission
from app.models.problem import Problem
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/submissions", tags=["submissions"])

@router.post("", response_model=SubmissionOut)
def create_submission(
    sub_in: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    problem = db.query(Problem).filter(Problem.id == sub_in.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    submission = Submission(
        user_id=current_user.id,
        problem_id=sub_in.problem_id,
        code=sub_in.code,
        status=sub_in.status,
        passed_cases=sub_in.passed_cases,
        total_cases=sub_in.total_cases,
        execution_time_ms=sub_in.execution_time_ms,
        error_message=sub_in.error_message
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    out = SubmissionOut.model_validate(submission)
    out.user_name = current_user.full_name
    out.problem_title = problem.title
    return out

@router.get("", response_model=List[SubmissionOut])
def list_submissions(
    problem_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Submission)
    
    # If student, can only see their own submissions unless specified
    if current_user.role == "STUDENT":
        query = query.filter(Submission.user_id == current_user.id)
    elif user_id:
        query = query.filter(Submission.user_id == user_id)

    if problem_id:
        query = query.filter(Submission.problem_id == problem_id)

    submissions = query.order_by(Submission.created_at.desc()).limit(100).all()

    results = []
    for s in submissions:
        item = SubmissionOut.model_validate(s)
        item.user_name = s.user.full_name if s.user else "Ẩn danh"
        item.problem_title = s.problem.title if s.problem else "Bài tập đã xóa"
        results.append(item)
    return results

@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài nộp")

    if current_user.role == "STUDENT" and sub.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem bài nộp này")

    item = SubmissionOut.model_validate(sub)
    item.user_name = sub.user.full_name if sub.user else "Ẩn danh"
    item.problem_title = sub.problem.title if sub.problem else "Bài tập đã xóa"
    return item

