const res = await fetch("https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=840&period=2023&cmdCode=85&flowCode=M&partnerCode=0");
const data = await res.json();
console.log("Status:", res.status);
console.log("Data:", data);
