"use strict";

let bypassTabIds = {};

chrome.webRequest.onBeforeRequest.addListener(
  ({tabId, method, url}) => {
    if(tabId < 1) return;

    if(method !== "GET") return;

    if(bypassTabIds[tabId + ""]) {
      delete bypassTabIds[tabId + ""];
      return;
    }

    let url1 = new URL(url);
    let host1 = url1.hostname;

    let url2 = extract(url1.search);
    let host2 = new URL(url2).hostname;

    if(host1 !== host2 || !isSameEnding(host1, host2)) {
      return {
        redirectUrl: chrome.runtime.getURL("redir.htm") + "?u=" + encodeURIComponent(url)
      };
    }
  },
  {
    urls: [
      "http://*/*?*http://*",
      "http://*/*?*https://*",
      "http://*/*?*http%3A%2F%2F*",
      "http://*/*?*https%3A%2F%2F*"
    ],
    types: ["main_frame"]
  },
  ["blocking"]
);

chrome.runtime.onMessage.addListener((msg, sender) => {
  if(sender.id !== chrome.runtime.id) return;
  if(msg.bypassTab) bypassTabIds[sender.tab.id + ""] = true;
});

function extract(url) {
  let pos = url.indexOf("http://");
  if(pos < 0) pos = url.indexOf("https://");
  if(pos < 0) pos = url.indexOf("http%3A%2F%2F");
  if(pos < 0) pos = url.indexOf("https%3A%2F%2F");
  
  url = url.substr(pos);

  pos = url.indexOf("&");
  if(pos > 0) url = url.substr(0, pos);

  if(url.substr(0, 8).indexOf("://") < 0) {
    url = decodeURIComponent(url);
  }

  return url;
}

function isSameEnding(host1, host2) {
  let len = Math.min(host1.length, host2.length);
  host1 = host1.substr(~len);
  host2 = host2.substr(~len);
  return host1 === host2;
}