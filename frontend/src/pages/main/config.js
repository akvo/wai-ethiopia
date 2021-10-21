const mapValues = (d) => {
  return d.columns.filter((x) => !isNaN(x.key)).map((x) => x.key);
};

const mapConfig = (h) => {
  return {
    ...h,
    values: mapValues(h),
    columns: h.columns.map((c) => ({
      ...c,
      dataIndex: c.key,
      ellipsis: true,
    })),
  };
};

const clts = {
  title: "CLTS",
  columns: [
    { title: "Name", key: "name", width: "30%" },
    { title: "ODF Status", key: 8 },
    { title: "Declared", key: 9 },
  ],
  charts: [
    { title: "CLTS Charts 01" },
    { title: "CLTS Charts 02" },
    { title: "CLTS Charts 03" },
    { title: "CLTS Charts 04" },
  ],
  maps: {
    shape: { id: 4, name: "Number of HHS" },
    marker: { id: 8, title: "ODF Status" },
  },
  formId: 1,
};

const health = {
  title: "Health Facility",
  columns: [
    { title: "Facilty Name", key: "name", width: "30%" },
    { title: "Water", key: 19 },
    { title: "Sanitation", key: 21 },
    { title: "Hygiene", key: 26 },
  ],
  charts: [
    { title: "Health Facility Charts 01" },
    { title: "Health Facility Charts 02" },
    { title: "Health Facility Charts 03" },
    { title: "Health Facility Charts 04" },
  ],
  maps: {
    shape: false,
    marker: { id: 19, name: "Water Service Level" },
  },
  formId: 2,
};

const households = {
  title: "Households",
  columns: [
    { title: "Name", key: "name", width: "30%" },
    { title: "Water", key: 35 },
    { title: "Sanitation", key: 39 },
    { title: "Hygiene", key: 44 },
  ],
  charts: [
    { title: "Household Charts 01" },
    { title: "Household Charts 02" },
    { title: "Household Charts 03" },
    { title: "Household Charts 04" },
  ],
  maps: {
    shape: { id: 33, name: "Household Size" },
    marker: { id: 35, title: "Water Service Level" },
  },
  formId: 3,
};

const schools = {
  title: "Schools Facility",
  columns: [
    { title: "School Name", key: "name", width: "30%" },
    { title: "Water", key: 56 },
    { title: "Sanitation", key: 61 },
    { title: "Hygiene", key: 67 },
  ],
  charts: [
    { title: "School Charts 01" },
    { title: "School Charts 02" },
    { title: "School Charts 03" },
    { title: "School Charts 04" },
  ],
  maps: {
    //shape: { id: 53, name: "Female Pupils" },
    shape: { id: 48, name: "Female Pupils" },
    marker: { id: 56, title: "Water Service Level" },
  },
  formId: 4,
};

const water = {
  title: "Water Point",
  columns: [
    { title: "Water Points", key: "name", width: "30%" },
    { title: "Number of Users", key: 82 },
    { title: "Water Source Type", key: 79 },
    { title: "Energy Source", key: 81 },
  ],
  charts: [
    { title: "Water Point Charts 01" },
    { title: "Water Point Charts 02" },
    { title: "Water Point Charts 03" },
    { title: "Water Point Charts 04" },
  ],
  maps: {
    shape: { id: 82, name: "Number of Users" },
    marker: { id: 80, title: "Functionality Status" },
  },
  formId: 5,
};

const config = {
  water: mapConfig(water),
  clts: mapConfig(clts),
  health: mapConfig(health),
  households: mapConfig(households),
  schools: mapConfig(schools),
};

export default config;
