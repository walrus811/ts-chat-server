# chatchat-server

This is the simple chat server with ws. Please read [1. How to start](howToStart) to run the program at first. The codebase offers three ways to run like below:

- [nodemon](https://www.npmjs.com/package/nodemon): for dev mode
- [pm2](https://pm2.keymetrics.io/): for prod mode
- [Docker](https://www.docker.com/): build the docker image and run it

## Contents

1. [How To start](#howToStart)
2. [API](#api)

<a name="howToStart"></a>

## 1. How to start

**prerequisite**

- [Dock Desktop](https://www.docker.com/products/docker-desktop/)

**set up**

```bash
git clone https://github.com/walrus811/ts-chat-server
cd ts-chat-server
npm i
```

### 1.1. nodemon

```bash
npm run dev
# > ts-chatchat-server@1.0.0 dev
# ......
# listening on 3000
curl "http://localhost:3000/hi"
# 마이크 테스트
```

If you use `Visual Studio code`, you can debug by press `F5` key.

### 1.2. pm2

```bash
npm i -g pm2
npm run start
# > ts-chatchat-server@1.0.0 start
# ......
# [PM2] App [chatchat] launched (2 instances)
curl "http://localhost:3000/hi"
# 마이크 테스트
```

### 1.3. docker

```bash
npm run docker
# > ts-chatchat-server@1.0.0 docker
# ......
# [+] Running 2/2
curl "http://localhost:3000/hi"
# 마이크 테스트
```

There's `docker:clean` command in package.json. It builds the docker image without cache data.

<a name="api"></a>

## 2. API

### page for test

you can access the test page with url `http://{url}/test`. you can test the basic features of the app here. The page's source file is [src/test.html](./src/test.html).

| path  | method | description                  | status |
| ----- | ------ | ---------------------------- | ------ |
| /test | GET    | load simple test page(.html) | 200    |

### RESTful Service

**user**

| path  | method | description                    | status |
| ----- | ------ | ------------------------------ | ------ |
| /user | GET    | get all the joined user's info | 200    |

### WebSocket Service

#### Message Format

If you want to get more info about the format, please check the file [src/models/Messages.ts](./src/models/Message.ts)

```json
{
  "message": "msg:chat",
  "data": {
    "text": "hi",
    "imageUrl": "data:image/gif;base64,R0lGODlh5gGkAXgAACH/C..."
  },
  "date": "2022-09-18T13:45:40.162Z"
}
```

> `?` means optional request param data

#### msg(client -> server)

| message     | data                                                                                                                                                                                               | after                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| msg:join    | name - string, nick name <br/> rejoin - boolean?, if it's true, you can change your nick name with name param data.                                                                                | broadcast:join, reply:join |
| msg:chat    | text - string, chat text message <br/>i mageUrl - [DataUrl](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs), chat image message                                        | broadcast:chat             |
| msg:to:chat | id - string, id to chat directly <br/> text - string, chat text message <br/> imageUrl - [DataUrl](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs), chat image message | broadcast:chat             |

> msg:\*:chat must have one content betwenn text or imageUrl!

#### broadcast(server -> all clients)

| message         | data                                                                                                                                                                                           | after |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| broadcast:join  | description - string, the default welcome message for joining <br/>rejoin - boolean?, whether it's rejoin or not.                                                                              |       |
| broadcast:leave | id - string, user's id left <br/> description - string, the default message for leaving                                                                                                        |       |
| broadcast:chat  | id - string, id sent the chat <br/> text - string, chat text message<br/> imageUrl - [DataUrl](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs), chat image message |       |

#### reply(server -> client)

| message       | data                                                                                                                                                                                           | after |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| reply:joined  |                                                                                                                                                                                                |       |
| reply:to:chat | id - string, id sent the chat <br/> text - string, chat text message<br/> imageUrl - [DataUrl](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs), chat image message |       |

#### error(server -> client)

| message              | data | after |
| -------------------- | ---- | ----- |
| error:invalidReq     |      |       |
| error:mustJoinBefore |      |       |
