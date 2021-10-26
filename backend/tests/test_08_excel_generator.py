import sys
import os
import pytest
import pandas as pd
from fastapi import FastAPI
from sqlalchemy.orm import Session
from db import crud_question
from util.excel import generate_excel_template, validate_excel_data
from util.excel import ExcelError

pytestmark = pytest.mark.asyncio
sys.path.append("..")


class TestTemplateGenerator():
    @pytest.mark.asyncio
    async def test_get_excel_template(self, app: FastAPI,
                                      session: Session) -> None:
        crud_question.add_question(session=session,
                                   name="Test Number Question",
                                   question_group=1,
                                   form=1,
                                   meta=False,
                                   type="number")
        crud_question.add_question(session=session,
                                   name="Test Multiple Option Question",
                                   question_group=1,
                                   form=1,
                                   meta=False,
                                   type="multiple_option",
                                   option=[{
                                       "name": "Option A",
                                       "order": 1
                                   }, {
                                       "name": "Option B",
                                       "order": 2
                                   }])
        excel_file = generate_excel_template(session=session, form=1)
        assert excel_file == "./tmp/1-test.xls"
        df = pd.read_excel(excel_file)
        assert list(df) == [
            "1|Test Option Question", "3|Test Geo Question",
            "4|Test Datapoint Text Question", "5|Test Number Question",
            "6|Test Multiple Option Question"
        ]
        os.remove(excel_file)

    @pytest.mark.asyncio
    async def test_validate_header_names(self, app: FastAPI,
                                         session: Session) -> None:
        excel_file = "./tmp/1-test.xls"
        wrong_data = [[
            "Option 4", "180,90", "Testing Data 1", "", "NA", "Option B"
        ], [
            "Option 2", "180,90", "Testing Data 2", "", 23, "Option C|Option D"
        ]]
        columns = [
            "2|Test Option Question", "Test Geo Question",
            "Test Datapoint Text Question", "", "5|Test Number Question",
            "6|Test Multiple Option Question"
        ]
        df = pd.DataFrame(wrong_data, columns=columns)
        df.to_excel(excel_file, index=False)
        errors = validate_excel_data(session=session,
                                     form=1,
                                     administration=1,
                                     file=excel_file)
        assert errors == [{
            'error': ExcelError.header,
            'message': "2|Test Option Question has invalid id",
            'column': "A1"
        }, {
            'error': ExcelError.header,
            'message': "Test Geo Question doesn't have question id",
            'column': "B1"
        }, {
            'error': ExcelError.header,
            'message': "Test Datapoint Text Question doesn't have question id",
            'column': "C1"
        }, {
            'error': ExcelError.header,
            'message': "Header name is missing",
            "column": "D1"
        }, {
            'error': ExcelError.value,
            'message': "Value should be numeric",
            "column": "E2"
        }, {
            'error': ExcelError.value,
            'message': "Invalid value: Option C, Option D",
            "column": "F3"
        }]
        os.remove(excel_file)
