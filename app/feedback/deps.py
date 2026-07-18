from app.feedback.db.models import Feedback


def get_feedback_repository() -> type[Feedback]:
    return Feedback
