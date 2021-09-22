import enum
from typing_extensions import TypedDict
from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey
from sqlalchemy import Boolean, Integer, String, Enum
from db.connection import Base


class QuestionType(enum.Enum):
    text = 'text'
    number = 'number'
    option = 'option'
    multiple_option = 'multiple_option'
    photo = 'photo'
    date = 'date'
    geo = 'geo'
    administration = 'administration'


class QuestionDict(TypedDict):
    id: int
    form: int
    question_group: int
    name: str
    meta: bool
    type: QuestionType


class Question(Base):
    __tablename__ = "question"
    id = Column(Integer, primary_key=True, index=True, nullable=True)
    form = Column(Integer, ForeignKey('form.id'))
    question_group = Column(Integer, ForeignKey('question_group.id'))
    name = Column(String)
    meta = Column(Boolean, default=False)
    type = Column(Enum(QuestionType), default=QuestionType.text)

    def __init__(self, name: str, meta: bool, type: QuestionType):
        self.name = name
        self.meta = meta
        self.type = type

    def __repr__(self) -> int:
        return f"<Question {self.id}>"

    @property
    def serialize(self) -> QuestionDict:
        return {
            "id": self.id,
            "form": self.form,
            "question_group": self.question_group,
            "name": self.name,
            "meta": self.meta,
            "type": self.type
        }


class QuestionBase(BaseModel):
    id: int
    name: str
    form: int
    question_group: int
    name: str
    meta: bool
    type: QuestionType

    class Config:
        orm_mode = True
