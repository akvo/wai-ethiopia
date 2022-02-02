import "leaflet/dist/leaflet.css";
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { Spin, Button, Space, Badge, Slider, Row, Col } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import api from "../../util/api";
import { scaleQuantize } from "d3-scale";
import { UIState } from "../../state/ui";
import _ from "lodash";
import { generateAdvanceFilterURL } from "../../util/utils";
import {
  getBounds,
  geojson,
  tileDelorme,
  defaultPos,
} from "../../util/geo-util";
import { Color } from "../../chart/chart-style";

const { shapeLevels } = window.map_config;
const mapMaxZoom = 14;
const defPos = defaultPos();
const colorRange = ["#bbedda", "#a7e1cb", "#92d5bd", "#7dcaaf", "#67bea1"];
const higlightColor = "#84b4cc";
const noDataColor = "#d3d3d3";

const Markers = ({ data, colors, filterMarker, defaultColors }) => {
  data = data.filter((d) => d.geo);
  const rowHovered = UIState.useState((e) => e.rowHovered);
  return data.map(({ id, geo, marker, name }) => {
    let hovered = id === rowHovered;
    let fill = "#F00";
    let r = 3;
    let stroke = "#fff";
    if (colors) {
      const option = colors.find(
        (c) => c.name?.toLowerCase() === marker?.toLowerCase()
      );
      fill = option ? option.color : "#FF0";
      if (!fill) {
        fill = defaultColors?.find(
          (d) => d.name?.toLowerCase() === marker?.toLowerCase()
        )?.color;
      }
    }
    if (filterMarker?.toLowerCase() === marker?.toLowerCase()) {
      hovered = true;
    }
    return (
      <Circle
        key={id}
        center={geo}
        pathOptions={{
          fillColor: hovered ? "#FFF" : fill,
          color: fill,
          opacity: 1,
          fillOpacity: 1,
        }}
        radius={r * 100 * (hovered ? 3 : 1)}
        stroke={stroke}
      >
        <Tooltip direction="top">
          <Badge count={marker} style={{ backgroundColor: fill }} /> {name}
        </Tooltip>
      </Circle>
    );
  });
};

const ShapeLegend = ({
  data,
  domain,
  thresholds,
  filterColor,
  setFilterColor,
  shapeQuestion,
  current,
  updatedColorRange,
}) => {
  const shapeCalculationType = current?.maps?.shape?.type;
  const percentSuffix = shapeCalculationType === "percentage" ? "%" : "";
  thresholds = Array.from(
    new Set(thresholds.map((x) => Math.round(Math.floor(x) / 10) * 10))
  );
  thresholds = thresholds.filter((x) => x !== 0);

  if (_.isEmpty(data) || !thresholds.length) {
    return "";
  }

  return (
    <div className="legends-wrapper">
      {!_.isEmpty(shapeQuestion) && (
        <h4>
          {current?.maps?.shape?.name?.toUpperCase() ||
            shapeQuestion?.name?.toUpperCase()}
        </h4>
      )}
      <Slider
        range
        min={domain[0]}
        max={domain[1]}
        value={filterColor ? filterColor : domain}
        onChange={(val) => {
          setFilterColor(val);
        }}
      />
      <Row
        align="center"
        justify="space-between"
        className="slider-number-wrapper"
      >
        <Col>{domain[0]}</Col>
        <Col>{domain[1]}</Col>
      </Row>
    </div>
  );
};

const MarkerLegend = ({
  data,
  markerQuestion,
  filterMarker,
  setFilterMarker,
}) => {
  if (_.isEmpty(data)) {
    return "";
  }

  const option = _.sortBy(markerQuestion?.option)?.map((x, i) => (
    <Space
      key={`marker-legend-${x.name}-${i}`}
      size="small"
      align="center"
      className={
        "marker-item" +
        (filterMarker?.toLowerCase() === x.name?.toLowerCase()
          ? " marker-item-selected"
          : "")
      }
      onClick={() =>
        filterMarker?.toLowerCase() === x.name?.toLowerCase()
          ? setFilterMarker(null)
          : setFilterMarker(x.name)
      }
    >
      <span
        className="marker-icon"
        style={{ backgroundColor: x.color || Color.color[i] }}
      ></span>
      <span className="marker-name">{x.name}</span>
    </Space>
  ));
  return (
    <div className="marker-legends">
      <h4>{markerQuestion?.name?.toUpperCase() || "Legend"}</h4>
      {option.map((o, i) => (
        <div key={i} className="marker-list">
          {o}
        </div>
      ))}
    </div>
  );
};

const MainMaps = ({ question, current, mapHeight = 350 }) => {
  const {
    user,
    administration,
    selectedAdministration,
    advanceSearchValue,
    loadedFormId,
  } = UIState.useState((s) => s);
  const [map, setMap] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(null);
  const [filterColor, setFilterColor] = useState(null);
  const [filterMarker, setFilterMarker] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeTooltip, setShapeTooltip] = useState("");
  const markerQuestion = question.find(
    (q) => q.id === current.maps?.marker?.id
  );
  const defaultMarkerColor = _.sortBy(markerQuestion?.option)?.map((m, i) => ({
    ...m,
    color: m.color || Color.color[i],
  }));
  const shapeQuestion = question.find((q) => q.id === current.maps?.shape?.id);

  useEffect(() => {
    if (
      user &&
      current &&
      loadedFormId !== null &&
      loadedFormId === current?.formId
    ) {
      setLoading(true);
      let url = `maps/${current.formId}`;
      if (current.maps.shape) {
        url += `?shape=${current.maps.shape.id}`;
      }
      if (current.maps.shape) {
        url += `&marker=${current.maps.marker.id}`;
      }
      // advance search
      url = generateAdvanceFilterURL(advanceSearchValue, url);
      api
        .get(url)
        .then((res) => {
          const { option } = shapeQuestion;
          const { calculatedBy } = current.maps?.shape;
          let data = res.data;
          if (shapeQuestion?.type === "option" && calculatedBy) {
            // fetch option value to calculated from question options
            let optionToCalculated =
              calculatedBy === "all" || !calculatedBy.length
                ? option
                : option.filter((opt) =>
                    calculatedBy.map((x) => x.id).includes(opt?.id)
                  );
            // transformed the data
            data = data.map((d) => {
              // find the option by shape === option name from optionToCalculated
              const findOption = optionToCalculated.find(
                (opt) => opt?.name?.toLowerCase() === d?.shape?.toLowerCase()
              );
              return {
                ...d,
                // replace shape value with option score, or
                // replace with 0 if option answer is not in calculatedBy config
                score: findOption?.score || 0,
              };
            });
          }
          setData(data);
          setLoading(false);
        })
        .catch(() => {
          setData([]);
          setLoading(false);
        });
    }
  }, [user, current, loadedFormId, advanceSearchValue, shapeQuestion]);

  const shapeShadingType = current?.maps?.shape?.type;
  const jmpColorRange = _.orderBy(
    shapeQuestion?.option,
    ["order"],
    ["desc"]
  )?.map((opt) => opt.color);
  const updatedColorRange = jmpColorRange.length ? jmpColorRange : colorRange;

  const shapeColor = _.chain(_.groupBy(data, "loc"))
    .map((v, k) => {
      let values = _.sumBy(v, "shape");
      // change shapeColor calculation if type described in config
      if (shapeShadingType === "percentage") {
        const filterData = v.filter((x) => x.score);
        values = Math.round((filterData.length / v.length) * 100);
      }
      if (shapeShadingType === "score") {
        values = _.sumBy(v, "score");
      }
      return {
        name: k,
        values: values,
      };
    })
    .value();

  const domain =
    shapeShadingType === "percentage"
      ? [0, 100]
      : shapeColor
          .reduce(
            (acc, curr) => {
              const v = curr.values;
              const [min, max] = acc;
              return [min, v > max ? v : max];
            },
            [0, 0]
          )
          .map((acc, index) => {
            if (index && acc) {
              acc = acc < 10 ? 10 : acc;
              const neaerestTo = Math.pow(
                10,
                Math.floor(Math.log(acc) / Math.log(10))
              );
              acc = Math.ceil(acc / neaerestTo) * neaerestTo;
            }
            return acc;
          });

  const colorScale = scaleQuantize().domain(domain).range(updatedColorRange);

  const adminLevel = [false, ...shapeLevels][selectedAdministration.length - 1];

  const adminName = administration.find(
    (a) => a.id === _.takeRight(selectedAdministration)[0]
  );

  const fillColor = (v) => {
    const color = v === 0 ? "#FFF" : colorScale(v);
    if (filterColor !== null) {
      const start = filterColor[0];
      const end = filterColor[1];
      return _.inRange(v, start, end) ? color : "#fff";
    }
    return color;
  };

  useEffect(() => {
    if (map && administration.length) {
      const pos = getBounds(selectedAdministration, administration);
      map.fitBounds(pos.bbox);
      setCurrentZoom(map.getZoom());
    }
  }, [map, administration, selectedAdministration]);

  useEffect(() => {
    if (selectedShape && administration.length) {
      const selected = shapeLevels.map(
        (s) =>
          administration.find((a) => a.name === selectedShape?.properties?.[s])
            ?.id
      );
      UIState.update((u) => {
        u.selectedAdministration = [null, ...selected];
      });
    }
  }, [selectedShape, administration]);

  useEffect(() => {
    // this is use to set the shape tooltip element by mouseover on leaflet maps
    if (hoveredShape && data.length && shapeQuestion) {
      const location =
        hoveredShape?.properties[shapeLevels[shapeLevels.length - 1]];
      const filteredData = data?.filter(
        (d) => d.loc.toLowerCase() === location.toLowerCase()
      );
      let tooltipElement = "";
      if (shapeQuestion?.type === "option") {
        let summaryData = _.chain(_.groupBy(filteredData, "shape"))
          .map((v, k) => {
            const percent = Math.round((v.length / filteredData.length) * 100);
            return {
              name: k,
              value: `${percent}%`,
            };
          })
          .value();
        // map to options
        summaryData = shapeQuestion?.option?.map((opt) => {
          const findOption = summaryData.find(
            (s) => s.name.toLowerCase() === opt.name.toLowerCase()
          );
          return {
            ...opt,
            value: findOption ? findOption.value : "0%",
          };
        });
        summaryData = _.orderBy(summaryData, ["order"]);
        tooltipElement = (
          <div className="shape-tooltip-container">
            <h4>{location}</h4>
            <Space direction="vertical">
              {summaryData?.map((x, i) => (
                <div
                  key={`${x.name}-${x.id}`}
                  className="shape-tooltip-wrapper"
                >
                  <span className="shape-tooltip-left-wrapper">
                    <span
                      className="shape-tooltip-icon"
                      style={{ backgroundColor: x.color || Color.color[i] }}
                    ></span>
                    <span className="shape-tooltip-name">{x.name}</span>
                  </span>
                  <span className="shape-tooltip-value">{x.value}</span>
                </div>
              ))}
            </Space>
          </div>
        );
      }
      if (shapeQuestion?.type !== "option") {
        const summaryData = _.sumBy(filteredData, "shape");
        tooltipElement = (
          <div className="shape-tooltip-container">
            <h4>{location}</h4>
            <Space direction="vertical">
              <div
                key={`${shapeQuestion.name}-${shapeQuestion.id}`}
                className="shape-tooltip-wrapper"
              >
                <span className="shape-tooltip-name">{shapeQuestion.name}</span>
                <span className="shape-tooltip-value">{summaryData}</span>
              </div>
            </Space>
          </div>
        );
      }
      setShapeTooltip(tooltipElement);
    }
  }, [hoveredShape, data, shapeQuestion]);

  const geoStyle = (g) => {
    const gname = g.properties[shapeLevels[shapeLevels.length - 1]];
    let sc = shapeColor.find((s) => s.name === gname);
    let opacity = 0.5;
    let color = "#00989f";
    if (adminLevel && adminName) {
      sc = g.properties[adminLevel] === adminName.name ? sc : false;
      opacity =
        g.properties[adminLevel] === adminName.name ? (sc ? 1 : 0.8) : 0.5;
      color = g.properties[adminLevel] === adminName.name ? "#000" : "#00989f";
    }

    if (adminName?.name === gname) {
      opacity = 1;
    }

    return {
      weight: opacity === 1 ? 2 : 1,
      fillColor: sc ? fillColor(sc.values || 0) : noDataColor,
      fillOpacity: sc ? 1 : opacity,
      opacity: 1,
      color: color,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: ({ target }) => {
        setSelectedShape(target?.feature);
      },
      mouseover: ({ target }) => {
        setHoveredShape(target?.feature);
      },
    });
  };

  return (
    <div className="leaflet-container">
      {loading && (
        <div className="map-loading">
          <Spin />
        </div>
      )}
      <ShapeLegend
        data={data}
        domain={domain}
        thresholds={colorScale.thresholds()}
        filterColor={filterColor}
        setFilterColor={setFilterColor}
        shapeQuestion={shapeQuestion}
        current={current}
        updatedColorRange={updatedColorRange}
      />
      <MarkerLegend
        data={data}
        markerQuestion={markerQuestion}
        filterMarker={filterMarker}
        setFilterMarker={setFilterMarker}
      />
      {map?._loaded && (
        <div className="map-buttons">
          <Space size="small" direction="vertical">
            <Button
              type="secondary"
              icon={<FullscreenOutlined />}
              onClick={() => {
                map.fitBounds(defPos.bbox);
                setCurrentZoom(map.getZoom());
              }}
            />
            <Button
              type="secondary"
              icon={<ZoomOutOutlined />}
              onClick={() => {
                const current = map.getZoom() - 1;
                map.setZoom(current);
                setCurrentZoom(current);
              }}
            />
            <Button
              disabled={currentZoom >= mapMaxZoom}
              type="secondary"
              icon={<ZoomInOutlined />}
              onClick={() => {
                const current = map.getZoom() + 1;
                map.setZoom(current);
                setCurrentZoom(current);
              }}
            />
          </Space>
        </div>
      )}
      {administration.length && (
        <MapContainer
          bounds={defPos.bbox}
          whenCreated={setMap}
          zoomControl={false}
          scrollWheelZoom={false}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer {...tileDelorme} />
          <GeoJSON
            key="geodata"
            style={geoStyle}
            data={geojson}
            onEachFeature={onEachFeature}
          >
            {hoveredShape && <Tooltip>{shapeTooltip}</Tooltip>}
          </GeoJSON>
          {!loading && (
            <Markers
              data={data}
              colors={markerQuestion?.option}
              defaultColors={defaultMarkerColor}
              filterMarker={filterMarker}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
};

export default MainMaps;
