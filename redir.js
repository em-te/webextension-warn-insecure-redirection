"use strict";

function $(id) {
  return document.getElementById(id);
}

function init() {
  //get the target URL from the current URL's search params
  let url = location.search;
  url = decodeURIComponent(url.substr(url.indexOf("u=") + 2));

  let url1 = toHTTPs(url);

  //extract embedded URL from target URL
  let url2 = extract(new URL(url).search);

  //sometimes the embedded URL doesn't include the "?"
  let pos1 = url2.indexOf("?");
  let pos2 = url2.indexOf("&");
  if(pos1 < pos2) {
    url2 = url2.replace("&", "?&");
  }
  url2 = toHTTPs(url2);

  $("httpsUrl").href = url1;
  $("redirUrl").href = url2;
  $("origUrl").href = url;

  //makes the "http:" part stand out
  insertHTTPText($("httpsAddr"), truncate(url1));
  insertHTTPText($("redirAddr"), truncate(url2));
  insertHTTPText($("origAddr"), truncate(url));

  let state = history.state;
  if(state) {
    //if the user is visiting this page a 2nd time (reload/back button)
    //set this so that we don't redirect the user automatically
    state.visited = true;
  } else {
    state = {};
    history.replaceState(state, "");  //so that we don't redirect on refresh
  }

  if(state.httpsOk) {
    //set icon to checkmark
    $("httpsIcon").textContent = String.fromCodePoint(10003);
  } else {
    //make a request to the root level page to see if it is accessible
    fetch(
      "https://" + new URL(url1).hostname,
      {method: "HEAD", redirect: "manual", credentials: "omit"}
    ).then(() => {
      state.httpsOk = true;
      history.replaceState(state, "");

      //set icon to checkmark
      $("httpsIcon").textContent = String.fromCodePoint(10003);

      if(!state.visited) {
        $("httpsUrl").classList.add("selected");
        //people like to see "stuff" before being immediately taken away
        setTimeout(() => location.href = url1, 1000);
      }

    }, () => {
      //set icon to cross mark
      $("httpsIcon").textContent = String.fromCodePoint(10007);
    });
  }
 
  if(state.redirOk) {
    //set icon to checkmark
    $("redirIcon").textContent = String.fromCodePoint(10003);

    //set the original URL icon to checkmark only if we have better alternatives
    if(!state.httpsOk) $("origIcon").textContent = String.fromCodePoint(10003);
  } else {
    //make a request to the root level page to see if it is accessible
    fetch(
      "https://" + new URL(url2).hostname,
      {method: "HEAD", redirect: "manual", credentials: "omit"}
    ).then(() => {
      state.redirOk = true;
      history.replaceState(state, "");

      //set icon to checkmark
      $("redirIcon").textContent = String.fromCodePoint(10003);

      //set the original URL icon to checkmark only if we have better alternatives
      if(!state.httpsOk) $("origIcon").textContent = String.fromCodePoint(10003);

    }, () => {
      //set icon to cross mark
      $("redirIcon").textContent = String.fromCodePoint(10007);
    });
  }

  chrome.runtime.sendMessage({bypassTab: true});

  document.title = url;

  let hostname = new URL(url).hostname;
  $("settingsUrl").textContent = hostname;

  if(!state.visited) {
    chrome.storage.local.get("domains", ({domains}) => {
      let action = domains && domains[hostname];
      if(action) {
        let node = action === 1 ? $("httpsUrl") : action === 2 ? $("redirUrl") : action === 3 ? $("origUrl") : null;
        if(node) {
          node.classList.add("selected");
          node.click();
          node.focus();
        }
      }
    });
  }

  $("settings").onclick = () => {
    chrome.runtime.openOptionsPage();
    chrome.storage.local.set({lastHost: hostname});
  };
}

init();

function insertHTTPText(node, str) {
  node.textContent = "";
  let pos = str.indexOf(":");
  node.appendChild(document.createElement("strong")).textContent = str.substr(0, pos);  //http

  node.appendChild(document.createTextNode("://"));

  str = str.substr(pos + 3);
  pos = str.indexOf("/");
  if(pos < 0) pos = str.length;
  node.appendChild(document.createElement("strong")).textContent = str.substr(0, pos);  //domain

  node.appendChild(document.createTextNode(str.substr(pos)));  //path
}

function truncate(str) {
  return str.length > 200 ? str.substr(0, 200) + "..." : str;
}

function extract(url) {
  //get the URL that is embedded inside the main URL
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

function toHTTPs(url) {
  return url.substr(0, 5) === "http:" ? "https" + url.substr(4) : url;
}
