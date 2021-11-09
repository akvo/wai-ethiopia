import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Space,
  Divider,
  Button,
  Table,
  Pagination,
  Modal,
  notification,
} from "antd";
import {
  SaveOutlined,
  EditOutlined,
  UndoOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import takeRight from "lodash/takeRight";
import config, { columnNames } from "./admin-static";
import { UIState } from "../../state/ui";
import api from "../../util/api";
import { getLocationName, generateAdvanceFilterURL } from "../../util/utils";
import MainTableChild from "../main/MainTableChild.jsx";
import ErrorPage from "../../components/ErrorPage";
import {
  DataUpdateMessage,
  DataDeleteMessage,
} from "./../../components/Notifications";
import { SelectLevel, DropdownNavigation } from "../../components/common";
import ConfirmationModal from "../../components/ConfirmationModal";
import AdvanceSearch from "../../components/AdvanceSearch";
import isEmpty from "lodash/isEmpty";
import without from "lodash/without";
import union from "lodash/union";
import xor from "lodash/xor";

const getRowClassName = (record, editedRow) => {
  const edited = editedRow?.[record.key];
  if (edited) {
    return "edited";
  }
  return "";
};

const ManageData = () => {
  const {
    user,
    editedRow,
    reloadData,
    administration,
    selectedAdministration,
    advanceSearchValue,
  } = UIState.useState((s) => s);
  const [data, setData] = useState([]);
  const [dataId, setDataId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionGroup, setQuestionGroup] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState("water");
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exportLoading, setExportLoading] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState({ by: "", at: "" });

  //ConfirmationModal state
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    handleOk: null,
    type: "default",
  });

  const current = config?.[form];
  const dataSelected = dataId ? data.find((x) => x.key === dataId) : false;

  const { formId, title } = current;

  const showModal = (id) => {
    setDataId(id);
  };

  const handleOk = () => {
    setDataId(false);
  };

  const handleCancel = () => {
    setDataId(false);
  };

  const changePage = (p) => {
    setPage(p);
    setLoading(true);
  };

  const saveEdit = () => {
    setSaving(true);
    UIState.update((e) => {
      e.reloadData = false;
    });
    const savedValues = Object.keys(editedRow).map((k, v) => {
      const values = Object.keys(editedRow[k]).map((o, v) => ({
        question: o,
        value: editedRow[k][o],
      }));
      return { dataId: k, values: values };
    });
    const promises = savedValues.map((saved) => {
      return api.put(`data/${saved.dataId}`, saved.values).then((res) => {
        notification.success({
          message: <DataUpdateMessage id={saved.dataId} />,
        });
        return res.data;
      });
    });
    Promise.all(promises).then(() => {
      setSaving(false);
      UIState.update((e) => {
        e.editedRow = {};
      });
      UIState.update((e) => {
        e.reloadData = true;
      });
    });
  };

  const handleCloseConfirmationModal = () => {
    setConfirmationModal({
      ...confirmationModal,
      visible: false,
    });
  };

  const handleDelete = (value) => {
    UIState.update((e) => {
      e.reloadData = false;
    });
    api
      .delete(`data/${value?.id}`)
      .then((res) => {
        notification.success({ message: <DataDeleteMessage id={value.id} /> });
        UIState.update((e) => {
          e.reloadData = true;
        });
        return res;
      })
      .catch((err) => {
        notification.error({ message: "Opps, something went wrong." });
      })
      .finally(() => {
        handleCloseConfirmationModal();
      });
  };

  const handleBulkDelete = (values) => {
    setDeleting(true);
    UIState.update((e) => {
      e.reloadData = false;
    });
    const ids = values.join("&id=");
    api
      .delete(`data?id=${ids}`)
      .then((res) => {
        setSelectedRow([]);
        notification.success({ message: "Bulk delete success." });
        UIState.update((e) => {
          e.reloadData = true;
        });
        return res;
      })
      .catch((err) => {
        notification.error({ message: "Opps, something went wrong." });
      })
      .finally(() => {
        handleCloseConfirmationModal();
        setDeleting(false);
      });
  };

  const handleExport = () => {
    setExportLoading(true);
    const adminId = takeRight(selectedAdministration)[0];
    let url = `download/data?form_id=${formId}`;
    if (adminId) {
      url += `&administration=${adminId}`;
    }
    url = generateAdvanceFilterURL(advanceSearchValue, url);
    api
      .get(url)
      .then((d) => {
        console.log(d);
        setExportLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setExportLoading(false);
      });
  };

  const hasSelected = !isEmpty(selectedRow);
  const onSelectTableRow = ({ key }) => {
    selectedRow.includes(key)
      ? setSelectedRow(without(selectedRow, key))
      : setSelectedRow([...selectedRow, key]);
  };

  const onSelectAllTableRow = (isSelected) => {
    const ids = data.filter((x) => !x.disabled).map((x) => x.key);
    if (!isSelected && hasSelected) {
      setSelectedRow(xor(selectedRow, ids));
    }
    if (isSelected && !hasSelected) {
      setSelectedRow(ids);
    }
    if (isSelected && hasSelected) {
      setSelectedRow(union(selectedRow, ids));
    }
  };

  useEffect(() => {
    if (user && formId) {
      setPage(1);
      setPerPage(10);
      api.get(`form/${formId}`).then((d) => {
        setQuestionGroup(d.data.question_group);
        UIState.update((s) => {
          s.editedRow = {};
        });
      });
      setSelectedRow([]);
    }
  }, [user, formId]);

  useEffect(() => {
    if (user && formId && reloadData && administration) {
      setLoading(true);
      const adminId = takeRight(selectedAdministration)[0];
      let url = `data/form/${formId}?page=${page}&perpage=${perPage}`;
      if (adminId) {
        url += `&administration=${adminId}`;
      }
      // advance search
      url = generateAdvanceFilterURL(advanceSearchValue, url);
      api
        .get(url)
        .then((d) => {
          const tableData = d.data.data.map((x) => {
            const administrationParent = administration.find(
              (adm) => adm.id === x.administration
            )?.parent;
            const isActionDisabled =
              user?.role === "editor" &&
              !user?.access.includes(administrationParent);
            return {
              key: x.id,
              name: x.name,
              created: x.updated || x.created,
              created_by: x.updated_by || x.created_by,
              administration: getLocationName(x.administration, administration),
              detail: x.answer,
              disabled: isActionDisabled,
              action: (
                <Space size="small" align="center" wrap={true}>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => showModal(x.id)}
                    disabled={isActionDisabled}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      setConfirmationModal({
                        visible: true,
                        handleOk: () => handleDelete(x),
                        type: "delete",
                      })
                    }
                    disabled={isActionDisabled}
                  >
                    Delete
                  </Button>
                </Space>
              ),
            };
          });
          setData(tableData);
          setTotal(d.data.total);
          setLoading(false);
        })
        .catch(() => {
          setData([]);
          setTotal(0);
          setLoading(false);
        });
    }
    // eslint-disable-next-line
  }, [
    page,
    perPage,
    user,
    formId,
    reloadData,
    selectedAdministration,
    administration,
    advanceSearchValue,
  ]);

  useEffect(() => {
    if (user && current) {
      const adminId = takeRight(selectedAdministration)[0];
      let url = `last-submitted?form_id=${current.formId}`;
      if (adminId) {
        url += `&administration=${adminId}`;
      }
      // advance search
      url = generateAdvanceFilterURL(advanceSearchValue, url);
      api
        .get(url)
        .then((res) => {
          setLastSubmitted(res.data);
        })
        .catch(() => {
          setLastSubmitted({ by: "", at: "" });
        });
    }
  }, [user, current, selectedAdministration, advanceSearchValue]);

  if (!current) {
    return <ErrorPage status={404} />;
  }

  return (
    <>
      <div className="filter-wrapper">
        <Space size={20} align="center" wrap={true}>
          <DropdownNavigation value={form} onChange={setForm} />
          <SelectLevel setPage={setPage} setSelectedRow={setSelectedRow} />
        </Space>
        <Button
          type="primary"
          className="export-filter-button"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={exportLoading}
        >
          Export Filtered Data
        </Button>
      </div>
      <AdvanceSearch
        formId={formId}
        questionGroup={questionGroup}
        setPage={setPage}
        setSelectedRow={setSelectedRow}
      />
      <Row
        align="middle"
        justify="space-between"
        wrap={true}
        className="data-info"
      >
        <Col span={8}>
          <span className="info title">
            {total ? `Total: ${total} Submissions` : "No Data"}
            {hasSelected
              ? `, Selected ${selectedRow.length} datapoint${
                  selectedRow.length > 1 ? "s" : ""
                }`
              : ""}
          </span>
        </Col>
        <Col span={16} align="end">
          {total ? (
            <div className="info">
              Last submitted: {lastSubmitted.at}
              <br />
              by: {lastSubmitted.by}
            </div>
          ) : (
            ""
          )}
        </Col>
      </Row>
      <div className="table-wrapper">
        <Table
          size="small"
          rowClassName={(record) => getRowClassName(record, editedRow)}
          loading={loading}
          columns={columnNames}
          scroll={perPage > 10 ? { y: 420 } : false}
          pagination={false}
          dataSource={data}
          rowSelection={{
            selectedRowKeys: selectedRow,
            onSelect: onSelectTableRow,
            onSelectAll: onSelectAllTableRow,
            getCheckboxProps: (record) => ({
              disabled: record?.disabled,
            }),
          }}
        />
        <Divider />
        <Row align="middle" justify="space-around">
          <Col span={16}>
            {total ? (
              <Pagination
                defaultCurrent={1}
                current={page}
                total={total}
                onShowSizeChange={(e, s) => {
                  setPerPage(s);
                }}
                pageSizeOptions={[10, 20, 50]}
                onChange={changePage}
              />
            ) : (
              ""
            )}
          </Col>
          <Col span={8} align="right">
            <Space>
              <Button
                loading={saving}
                disabled={Object.keys(editedRow).length === 0}
                onClick={saveEdit}
              >
                Save Changes
              </Button>
              <Button
                loading={deleting}
                disabled={!hasSelected}
                onClick={() =>
                  setConfirmationModal({
                    visible: true,
                    handleOk: () => handleBulkDelete(selectedRow),
                    type: "delete",
                  })
                }
              >
                Delete Selected
              </Button>
              <Link to={`/form/new-${title.toLowerCase()}/${formId}`}>
                <Button>Add New</Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </div>
      {dataSelected ? (
        <Modal
          title={dataSelected?.name}
          bodyStyle={{ padding: "0px" }}
          visible={dataSelected}
          className="data-edit-modal"
          centered
          width={640}
          onOk={handleOk}
          okText={editedRow?.[dataId] ? "Save Draft" : "Close"}
          cancelText={"Reset All"}
          cancelButtonProps={{
            icon: <UndoOutlined />,
            type: "danger",
            style: { float: "left" },
            disabled: !editedRow?.[dataId],
          }}
          okButtonProps={editedRow?.[dataId] && { icon: <SaveOutlined /> }}
          onCancel={handleCancel}
        >
          <div className="modal-wrapper">
            <MainTableChild
              questionGroup={questionGroup}
              data={dataSelected}
              scroll={400}
            />
          </div>
        </Modal>
      ) : (
        ""
      )}

      {/* ConfirmationModal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        type={confirmationModal.type}
        onOk={confirmationModal.handleOk}
        onCancel={() => handleCloseConfirmationModal()}
      />
    </>
  );
};

export default ManageData;
