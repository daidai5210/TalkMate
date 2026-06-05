from typing import Optional

from sqlalchemy.orm import Session

from app.modules.auth.models import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str, include_deleted: bool = False) -> Optional[User]:
        query = self.db.query(User).filter(User.username == username)
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))
        return query.first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(User.id == user_id, User.deleted_at.is_(None))
            .first()
        )

    def create(self, username: str, password_hash: str) -> User:
        user = User(username=username, password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
