from typing import List
from typing_extensions import TypedDict
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.connection import Base
from models.question import QuestionBase


class QuestionGroupDict(TypedDict):
    id: int
    form: int
    name: str


class QuestionGroup(Base):
    __tablename__ = "question_group"
    id = Column(Integer, primary_key=True, index=True, nullable=True)
    form = Column(Integer, ForeignKey('form.id'))
    name = Column(String)
    question = relationship("Question",
                            cascade="all, delete",
                            passive_deletes=True,
                            backref="question")

    def __init__(self, name: str):
        self.name = name

    def __repr__(self) -> int:
        return f"<QuestionGroup {self.id}>"

    @property
    def serialize(self) -> QuestionGroupDict:
        return {
            "id": self.id,
            "form": self.form,
            "name": self.name,
            "question": self.question
        }


class QuestionGroupBase(BaseModel):
    id: int
    form: int
    name: str
    question: List[QuestionBase]

    class Config:
        orm_mode = True
