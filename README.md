## Automerge Todo Example

[공식문서 튜토리얼](https://automerge.org/docs/tutorial/introduction/)을 따라 작성된 프로젝트입니다.

## 실행

### Client

http://localhost:8080/#1

```
yarn webpack serve
```

### Server

http://localhost:3001

```
node server.js
```

## Automerge functions

### `Automerge.init()`

Automerge 문서는 JSON 객체이다.
새로운 문서 객체를 `init` 으로 만들 수 있다.

```js
let doc = Automerge.init();
```

만약 문서를 변경하고 싶다면 새로운 docs를 만들어서 기존 `doc`에 할당하는 함수형 방식을 따라야한다.

```js
function updateDoc(newDoc) {
  doc = newDoc;
}
```

### `Automerge.getActorId(doc)`

각 문서 객체는 `actorId` 를 가지고 있다.
`actorId`는 Automerge가 어떤 프로세스나 장치가 변경 사항을 만드는지 알 수 있게한다.

### `Automerge.change(doc, (doc) => { doc에게 side effect })`

`change`는 변경하고 싶은 문서객체 `doc` 을 첫번째 인수로 받고, 두번째 인수로 `doc`을 부수효과 일으키는 콜백을 받는다.

반환되는 값은 새로운 `newDoc` 객체이며, 이를 `doc` 에 재할당 하여 변경사항을 적용할 수 있다.

```js
let newDoc = Automerge.change(doc, (doc) => {
  /** 이 안에선 부수효과를 일으켜서 수정한다. */
  if (!doc.items) doc.items = [];
  doc.items.push({ text, done: false });
});
```

### `Automerge.save(newDoc)`

문서 객체를 저장하기 위한 함수이다.
반환값은 binary 값으로 서버나 저장장치에 저장할 수 있다.

```js
let binary = Automerge.save(newDoc);
localforage.setItem(docId, binary);
```

### `Automerge.merge(doc, newDoc)`

기존 doc 문서에 새로운 newDoc를 merge 할 수 있다.

### `Automerge.load(binary)`

이진 데이터를 직렬화 해제하여 새로운 doc 객체를 만들어낸다.

```js
let newDoc = Automerge.merge(doc, Automerge.load(binary));
```
