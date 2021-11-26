import TabJMP from "./TabJMP";
import TabODF from "./TabODF";

const TabContent = ({ parentLoading, show, current, question, self, data }) => {
  const { component, chartList, chartSetting } = self;
  const { formId } = current;
  switch (component) {
    case "JMP-CHARTS":
      return (
        <TabJMP
          show={show}
          formId={formId}
          chartList={chartList}
          question={question}
        />
      );
    case "ODF-CHARTS":
      return (
        <TabODF
          show={show}
          setting={chartSetting}
          data={data || []}
          loading={parentLoading}
        />
      );
    default:
      return "";
  }
};

export default TabContent;
