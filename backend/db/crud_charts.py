from sqlalchemy.orm import Session, aliased
from sqlalchemy import and_, func
from models.answer import Answer
from models.data import Data
from models.views.view_data import ViewData
import collections
from itertools import groupby
from typing import List


def get_chart_data(session: Session,
                   form: int,
                   question: int,
                   stack: int = None,
                   administration: List[str] = None,
                   options: List[str] = None):
    # get list of data ids
    data = session.query(Data.id).filter(Data.form == form)
    if options:
        data_id = session.query(ViewData.data).filter(
            ViewData.options.contains(options)).all()
        data = data.filter(Data.id.in_([d.data for d in data_id]))
    if administration:
        data = data.filter(Data.administration.in_(administration))
    data = [d.id for d in data.all()]

    # chart query
    type = "BAR"
    if stack:
        type = "BARSTACK"
        answerStack = aliased(Answer)
        answer = session.query(Answer.options, answerStack.options,
                               func.count())
        # filter
        answer = answer.filter(Answer.data.in_(data))
        answer = answer.join((answerStack,
                              Answer.data == answerStack.data))
        answer = answer.filter(and_(Answer.question == question,
                                    answerStack.question == stack))
        answer = answer.group_by(Answer.options, answerStack.options)
        answer = answer.all()
        answer = [{"axis": a[0][0].lower(), "stack": a[1][0].lower(),
                   "value": a[2]} for a in answer]
        temp = []
        answer.sort(key=lambda x: x["axis"])
        for k, v in groupby(answer, key=lambda x: x["axis"]):
            child = [{x["stack"]: x["value"]} for x in list(v)]
            counter = collections.Counter()
            for d in child:
                counter.update(d)
            child = [{"name": key, "value": val}
                     for key, val in dict(counter).items()]
            temp.append({
                "group": k,
                "child": child
            })
        answer = temp
    else:
        answer = session.query(Answer.options,
                               func.count(Answer.id))
        # filter
        answer = answer.filter(Answer.data.in_(data))
        answer = answer.filter(Answer.question == question)
        answer = answer.group_by(Answer.options)
        answer = answer.all()
        answer = [{a[0][0].lower(): a[1]} for a in answer]
        counter = collections.Counter()
        for d in answer:
            counter.update(d)
        answer = [{"name": k, "value": v} for k, v in dict(counter).items()]
    return {"type": type, "data": answer}
