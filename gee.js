// Download the ZIP codes of the USA from https://www2.census.gov/geo/tiger/TIGER2020/ZCTA5/
// upload the file in Google Earth Engine Console

// Load USA zipCodes file
var zipCodes = ee.FeatureCollection(
  "projects/geospatial-463715/assets/tl_2020_us_zcta510"
);

// Load California state boundary
var california = ee
  .FeatureCollection("TIGER/2018/States")
  .filter(ee.Filter.eq("NAME", "California"));

// Filter ZIPs to only those that intersect California
var zipCA = zipCodes.filterBounds(california);

// Load Sentinel-2 imagery
var s2 = ee
  .ImageCollection("COPERNICUS/S2_SR")
  .filterDate("2023-06-01", "2023-08-31")
  .filterBounds(california)
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20));

// Compute NDVI = (B8 - B4) / (B8 + B4)
var ndvi = s2.map(function (image) {
  return image
    .normalizedDifference(["B8", "B4"])
    .rename("NDVI")
    .copyProperties(image, ["system:time_start"]);
});

// Take the mean NDVI over time
var meanNDVI = ndvi.mean();

// Reduce NDVI by ZIP polygons
var ndviByZIP = meanNDVI.reduceRegions({
  collection: zipCA,
  reducer: ee.Reducer.mean(),
  scale: 30,
});

// Export to Drive
Export.table.toDrive({
  collection: ndviByZIP,
  description: "NDVI_by_ZIP_CA_2023_Summer",
  fileFormat: "CSV",
});
