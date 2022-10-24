/*************** Automerge handler ****************/
import * as Automerge from "@automerge/automerge";
// let docId = window.location.hash.replace(/^#/, "");
let docId = window.location.hash.replace(/^#/, "");

let binary = await localforage.getItem(docId);
let channel = new BroadcastChannel(docId);
let doc = Automerge.init();

let actorId = Automerge.getActorId(doc);
console.log({ actorId, docId });

/** 서버에서 현재 docId 의 문서를 로드함 */
async function loadFromRemote(docId) {
  const response = await fetch(`http://localhost:3001/${docId}`);
  if (response.status !== 200)
    throw new Error("No saved draft for doc with id=" + docId);
  const respbuffer = await response.arrayBuffer();
  if (respbuffer.byteLength === 0)
    throw new Error("No saved draft for doc with id=" + docId);
  const view = new Uint8Array(respbuffer);
  let newDoc = Automerge.merge(doc, Automerge.load(view));
  doc = newDoc;
  render(newDoc);
}
loadFromRemote(docId);

/** 서버에 binary 저장 */
function saveToRemote(docId, binary) {
  fetch(`http://localhost:3001/${docId}`, {
    body: binary,
    method: "post",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  }).catch((err) => console.log(err));
}

/** localforage 저장소에 doc이 있으면 load함 */
if (binary) {
  doc = Automerge.load(binary);
  render(doc);
}

/** 서버에서 메시지를 받으면 merge함.
 * 모든 docs를 직렬화해서 보내면 효율이 떨어지므로,
 * 성능을 위해서는 업데이트된 일부만 보내는 방식을 사용해야함.
 * https://automerge.org/docs/cookbook/real-time/
 *  */
channel.onmessage = (ev) => {
  let newDoc = Automerge.merge(doc, Automerge.load(ev.data));
  doc = newDoc;
  render(newDoc);
};

/** 불변성: document를 새로운 doc으로 업데이트 해주어야함.
 * doc = newDoc;
 */
/** Automerge는 함수형이라 모든 doc들은 불변하다.  */
function updateDoc(newDoc) {
  doc = newDoc;
  render(newDoc);
  let binary = Automerge.save(newDoc);
  localforage.setItem(docId, binary).catch((err) => console.log(err));
  channel.postMessage(binary);
  saveToRemote(docId, binary);
}

/** 변경 사항을 change로 생성함 */
function addItem(text) {
  /** Automerge.change 는 기존 doc을 수정하는게 아니라, 새로운 doc을 만든다. */
  let newDoc = Automerge.change(doc, (doc) => {
    /** 이 안에선 부수효과를 일으켜서 수정한다. */
    if (!doc.items) doc.items = [];
    doc.items.push({ text, done: false });
  });
  updateDoc(newDoc);
}

function toggle(index) {
  let newDoc = Automerge.change(doc, (doc) => {
    if (!doc.items || !doc.items[index]) return;
    doc.items[index].done = !doc.items[index].done;
  });
  updateDoc(newDoc);
}

/*************** HTML handler ****************/
let form = document.querySelector("form");
let input = document.querySelector("#new-todo");

form.onsubmit = (ev) => {
  ev.preventDefault();
  addItem(input.value);
  input.value = null;
};

function render(doc) {
  let list = document.querySelector("#todo-list");
  list.innerHTML = "";
  doc.items &&
    doc.items.forEach((item, index) => {
      let itemEl = document.createElement("li");
      itemEl.innerText = item.text;
      itemEl.dataset.index = index;
      itemEl.style = item.done ? "text-decoration: line-through" : "";
      itemEl.onclick = (ev) => {
        ev.preventDefault();
        const { index } = ev.target.dataset;
        if (!index) return;
        toggle(index);
      };
      list.appendChild(itemEl);
    });
}
