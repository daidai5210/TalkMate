from typing import List

from sqlalchemy.orm import Session

from app.modules.scenario.models import Scenario


class ScenarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_ordered(self) -> List[Scenario]:
        return (
            self.db.query(Scenario)
            .order_by(Scenario.sort_order.asc(), Scenario.id.asc())
            .all()
        )

    def count(self) -> int:
        return self.db.query(Scenario).count()
