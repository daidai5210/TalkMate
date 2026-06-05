from pydantic import BaseModel


class ScenarioPublic(BaseModel):
    id: int
    name: str
    description: str
    icon: str

    model_config = {"from_attributes": True}
