"use strict";

function init() {
  let ul = document.querySelector("ul");

  ul.onchange = e => {
    let n = e.target;

    if(n && n.localName === "select") {
      let li = n.parentNode.parentNode;
      let name = li.querySelector("input").value;
      if(name) saveAll();
      if(li.animate) li.animate([{backgroundColor: "#aaa"}, {backgroundColor: window.getComputedStyle(li).backgroundColor}], 1000);

    } else if(n && n.localName === "input") {
      let li = n.parentNode.parentNode;
      if(n.value && li.querySelector("select").value !== "none") {
        saveAll();
      }
      if(li.animate) li.animate([{backgroundColor: "#aaa"}, {backgroundColor: window.getComputedStyle(li).backgroundColor}], 1000);
    }
  };

  ul.onclick = e => {
    let n = e.target;

    if(n && n.localName === "button" && n.classList.contains("remove")) {
      let li = n.parentNode;

      li.querySelector("input").value = "";  //clear it so that saveAll will ignore it
      li.querySelector("select").value = "none";

      if(li.animate) {
        li.animate([{opacity: 1}, {opacity: 0}], 500).onfinish = () => {
          li.parentNode.removeChild(li);
        };
      } else {
        li.parentNode.removeChild(li);
      }
      saveAll();
    }
  };
}

init();

function saveAll() {
  let nodes = document.querySelectorAll("li");
  let domains = {};
  for(let li of nodes) {
    let name = li.querySelector("input").value;
    let method = li.querySelector("select").value;
    if(name && method !== "none") {
      domains[name] = method === "https" ? 1 : method === "redir" ? 2 : method === "orig" ? 3 : (()=>{throw method})();
    }
  }
  chrome.storage.local.set({domains});

  let li = document.querySelector("li");
  if(li.querySelector("input").value) {
    li.querySelector("button").disabled = false;
    li = li.parentNode.insertBefore(li.cloneNode(true), li);
    li.querySelector("input").value = "";
    li.querySelector("select").value = "none";
    li.querySelector("button").disabled = true;
  }
}

chrome.storage.local.get(["domains", "lastHost"], ({domains, lastHost}) => {
  if(domains) {
    let ul = document.querySelector("ul");
    let base = ul.querySelector("li");

    let frag = document.createDocumentFragment();

    for(let name in domains) {
      let li = base.cloneNode(true);

      li.querySelector("button").disabled = false;
      li.querySelector("input").value = name;

      let action = domains[name];
      li.querySelector("select").value = action === 1 ? "https" : action === 2 ? "redir" : action === 3 ? "orig" : "none";

      frag.appendChild(li);
    }

    ul.appendChild(frag);
    
  }
  if(lastHost) {
    let li = document.querySelector("li");
    li.querySelector("input").value = lastHost;
    li.querySelector("select").value = "none";

    chrome.storage.local.remove("lastHost");
  }
});

chrome.storage.onChanged.addListener(({lastHost}) => {
  if(lastHost && lastHost.newValue) {
    let li = document.querySelector("li");
    li.querySelector("input").value = lastHost.newValue;
    li.querySelector("select").value = "none";

    chrome.storage.local.remove("lastHost");
  }
});