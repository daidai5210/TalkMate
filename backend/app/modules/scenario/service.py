from typing import List

from sqlalchemy.orm import Session

from app.modules.scenario.repository import ScenarioRepository
from app.modules.scenario.schemas import ScenarioPublic


class ScenarioService:
    def __init__(self, db: Session):
        self.repo = ScenarioRepository(db)

    def list_scenarios(self) -> List[ScenarioPublic]:
        scenarios = self.repo.list_ordered()
        return [ScenarioPublic.model_validate(s) for s in scenarios]
