import React from "react";
import { Row, Col, Tabs, Button, Space } from "antd";

import "./admin.scss";
import ManageData from "./ManageData";
import ManageUser from "./ManageUser";
import Export from "./Export";

const { TabPane } = Tabs;

const Admin = () => {
  return (
    <Row className="admin-container">
      {/* Jumbotron */}
      <Col span={24}>
        <Row className="jumbotron-container">
          <Col span={24} className="container">
            <h1>Welcome Admin</h1>
          </Col>
        </Row>
      </Col>
      {/* Content */}
      <Col span={24} className="container content-wrapper">
        <div className="card-container">
          <Tabs type="card" size="large" tabBarGutter={0}>
            <TabPane tab="Manage Data" key="manage-data">
              <ManageData />
            </TabPane>
            <TabPane tab="Exports" key="exports">
              <Export />
            </TabPane>
            <TabPane tab="Data Upload" key="data-upload">
              <ManageData />
            </TabPane>
            <TabPane tab="Manage Users" key="manage-users">
              <ManageUser />
            </TabPane>
          </Tabs>
        </div>
      </Col>
    </Row>
  );
};

export default Admin;
