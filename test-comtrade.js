fetch("https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=840&period=2023&cmdCode=85&flowCode=M&partnerCode=0")
  .then(res => res.json())
  .then(data => console.log("DATA LENGTH:", data.data ? data.data.length : data, "ERROR:", data.error))
  .catch(console.error);
