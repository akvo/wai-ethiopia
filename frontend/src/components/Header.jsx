import React from "react";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Card,
  List,
  Badge,
  Avatar,
  Space,
  Popover,
} from "antd";
import {
  MenuOutlined,
  FieldTimeOutlined,
  UserOutlined,
  ExclamationCircleTwoTone,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { UIState } from "../state/ui";

const IconList = ({ type }) => {
  if (type === "warning") {
    return <ExclamationCircleTwoTone twoToneColor="#c4c41a" />;
  }
  if (type === "danger") {
    return <CloseCircleTwoTone twoToneColor="#eb2f96" />;
  }
  return <CheckCircleTwoTone twoToneColor="#52c41a" />;
};

const ActivityLog = () => {
  const { jobStatus } = UIState.useState((c) => c);
  if (jobStatus.length) {
    return (
      <List
        size="small"
        itemLayout="horizontal"
        dataSource={jobStatus}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<IconList type={item.icon} />}
              title={item.file}
              description={item.status}
            />
          </List.Item>
        )}
      />
    );
  }
  return <Card>No Activity</Card>;
};

const Header = () => {
  const { user, jobStatus } = UIState.useState((c) => c);
  const onOpen = () => {
    UIState.update((s) => {
      s.showNav = true;
    });
  };
  return (
    <Row align="middle" justify="space-between" wrap={true}>
      <Col span={8} className="header-logo">
        <Link to="/">
          <Space size={20}>
            <Avatar src="/wai-logo.png" alt="wai-logo" />
            <div className="web-title">WAI Ethiopia</div>
          </Space>
        </Link>
      </Col>
      <Col span={8} className="header-menu">
        <Space size={20}>
          {user && (
            <>
              <Popover
                title={"Recent Activity Log"}
                placement="bottom"
                content={<ActivityLog />}
                trigger="click"
              >
                <Badge count={jobStatus.length}>
                  <Button icon={<FieldTimeOutlined />}>Activity Log</Button>
                </Badge>
              </Popover>
              {user?.picture ? (
                <Avatar
                  src={`${user.picture}#${window.location.origin}/img.jpg`}
                  alt="user-avatar"
                />
              ) : (
                <Avatar icon={<UserOutlined />} alt="user-avatar" />
              )}
            </>
          )}
          <MenuOutlined onClick={onOpen} className="menu-outlined" />
        </Space>
      </Col>
    </Row>
  );
};

export default Header;
