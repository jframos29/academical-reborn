// Libs
"use strict";
const https = require("https");
const cheerio = require("cheerio");
const schedule = require("node-schedule");

// URLs
const BASE_PATH = "https://decanaturadeestudiantes.uniandes.edu.co";
const URL = "/index.php/es/eventos-de-la-semana/week.listevents/";
//Vars
let events = [];
let weeks = parseInt(process.argv[2], 10);
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

//------------
// HELPERS
//------------

/**
 * Add days to the specified date.
 * sparebytes https://stackoverflow.com/questions/563406/add-days-to-javascript-date
 * @param {*} date
 * @param {*} days
 */
function addDays(date, days) {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Formats the date for the query
function formatDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

// Gets the month index for the request
function parseMonth(month) {
  return months.indexOf(month);
}

// Check if event is ok to add to list
function isEventOk(event) {
  return event.title && event.type && event.link;
}

//-------------
// CODE
//-------------

// Makes a GET request with the given callback function
const scrapeEventsCulturalWebpage = (url, cb) => {
  https.get(BASE_PATH + url, res => {
    let html = "";

    res.on("data", chunk => {
      html += chunk;
    });

    res.on("end", () => {
      return cb(html);
    });
  });
};

// Retreives the events list
function parseEventList(html) {
  const $ = cheerio.load(html);
  let ev;

  $(".article_column").each((idx, el) => {
    ev = {};
    ev.link = $(el)
      .find(".ev_link_row")
      .attr("href");

    ev.title = $(el)
      .find(".ev_link_row")
      .text();
    ev.type = $(el)
      .find(".event_text")
      .text();

    if (isEventOk(ev)) {
      events.push(ev);
    }
  });

  // if there are more weeks to look for, retreive the missing event list, else look for the event detail
  if (--weeks) {
    let date = new Date();
    date = addDays(date, (5 - weeks) * 7);
    scrapeEventsCulturalWebpage(URL + formatDate(date), html =>
      parseEventList(html)
    );
  } else {
    events.forEach((el, index) => {
      scrapeEventsCulturalWebpage(el.link, html => parseEvent(index, html));
    });
  }
}

// Retrieve the information of the event detail
function parseEvent(index, html) {
  const $ = cheerio.load(html);

  let time = $(".ev_detail.repeat")
    .text()
    .split(",");
  let completeDay = time[1].trim().split(" ");

  // time setuo
  let ev = events[index];
  ev.weekDay = time[0];
  ev.day = completeDay[1];
  ev.month = parseMonth(completeDay[0]);
  ev.hour = time[3];

  $("tr[align=left] td table tbody tr td p").each((idx, el) => {
    let text = $(el).html();

    // If no labels return
    if (!text.includes("<strong>")) return;

    let strong = text.split("<strong>");
    // loop the text with labels
    for (let i = 1; i < strong.length; i++) {
      let split = strong[i].split("</strong>");

      if (split[0] === "Lugar:") {
        ev.place = split[1].trim().replace(new RegExp("<br>", "g"), "");
      }

      if (split[0] !== "Hora:") continue;

      ev.description = split[1]
        .split(".m.")[1]
        .replace(new RegExp("<br>", "g"), "");

      break;
    }
  });
  insertEvents();
}

function insertEvents() {
  // TODO: Connect with mongo
  //console.log(events);
}

//Second(OPTIONAL:0-59)    Minute(0-59)    Hour(0-23)    Day of month(1-31)    Month(1-12)    Day of week (0-7)

scrapeEventsCulturalWebpage(URL + formatDate(new Date()), html =>
  parseEventList(html)
);
schedule.scheduleJob(`* */${process.argv[3]} * * *`, function() {
  scrapeEventsCulturalWebpage(URL + formatDate(new Date()), html =>
    parseEventList(html)
  );
});
