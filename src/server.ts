import express, { ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import httpErrors, { HttpError } from 'http-errors';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import Message, { BroadcastJoinMessageData, MsgJoinMessageData, MessageType, MessageOnly, MsgChatMessageData, BroadcastChatMessageData, BroadcastLeaveMessageData, MsgToChatMessageData, ReplyToChatMessageData, MsgWelcomeMessageData } from './models/Message';
import ValueCell from './models/ValueCell';
import User from './models/User';
import _ from 'lodash';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketWithId } from './typedef';
import WebSocketStatusCode from './models/WebSocketStatusCode';
import path from 'path';
import { UserResponseBody } from './models/HttpResponseBody';

dotenv.config();
const MAX_DATA_LOG_SLICE = 1024 * 1;
const port = parseInt(process.env.PORT as string) || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const users = ValueCell<User[]>([]);

app.disable('x-powered-by');
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

wss.on("connection", (ws: WebSocketWithId, req) =>
{
  ws.id = uuidv4();

  console.info(`#${ws.id} is connected from ${req.socket.remoteAddress}`);

  const welcomeRequst = createMessage<MsgWelcomeMessageData>("reply:welcome", { id: ws.id });
  ws.send(JSON.stringify(welcomeRequst));
  ws.on("message", function onMessage(data)
  {
    if (!ws.id)
    {
      console.error(`It can't be happened! there's no client id from ${req.socket.remoteAddress}`);
      return ws.close(WebSocketStatusCode.InternalError, "please report to admin!");
    }

    console.info(`#${ws.id} get raw data, ${data.slice(0, MAX_DATA_LOG_SLICE).toString()}`);

    let requestBody = createMessageFromWsData(data);
    if (!requestBody)
      return console.error(`can't parse message, ${data.slice(0, MAX_DATA_LOG_SLICE).toString()}`);

    if (requestBody.message === "msg:join")
    {
      const requestData = requestBody.data as MsgJoinMessageData;
      if (!requestData.name)
      {
        console.error(`there's no name in join message`);
        const invalidRequestMessage = createMessageWithOutData("error:invalidReq");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      const currentUsers = users.val();
      const currentUser = _.find(currentUsers, (user) => user.client.id === ws.id);
      if (currentUser)
      {
        if (requestData.rejoin)
        {
          users.update((oldValue) => _.filter(oldValue, (user) => user !== currentUser));
        }
        else
        {
          console.error(`#${ws.id} has retried join...`);
          const alreadyJoinedMessage = createMessageWithOutData("reply:joined");
          return ws.send(JSON.stringify(alreadyJoinedMessage));
        }
      }

      let newUserName = requestData.name;

      const newClient = getWsClient(wss, ws.id);

      if (!newClient)
      {
        console.error(`It can't be happened! there's no data of #${ws.id}`);
        return ws.close(WebSocketStatusCode.InternalError, "please report to admin!");
      }

      const newUser = { client: newClient, name: newUserName, joinedDateTime: new Date() };
      users.update((oldValue) => [...oldValue, newUser]);
      console.info(`new client, #${newUser.client.id} is added with info, ${JSON.stringify(_.pick(newUser, ["name", "joinedDateTime"]))}`);

      const broadcastJoinMessage = createMessage<BroadcastJoinMessageData>(
        "broadcast:join",
        {
          id: ws.id,
          description: currentUser && requestData.rejoin ? `${currentUser.name}'s name has changed to ${newUserName}` : `📢 ${newUserName} has joined!`,
          rejoin: requestData.rejoin
        }
      );
      broadcastMessage(wss, broadcastJoinMessage);
    }
    else if (requestBody.message === "msg:chat")
    {
      const requestData = requestBody.data as MsgChatMessageData;
      if (!requestData.text && !requestData.imageUrl)
      {
        console.error(`there's no text of image in chat message`);
        const invalidRequestMessage = createMessageWithOutData("error:invalidReq");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      const currentUsers = users.val();
      const currentUser = _.find(currentUsers, (user) => user.client.id === ws.id);

      if (!currentUser || !currentUser.client.id)
      {
        console.warn(`there's no user of #${ws.id}`);
        const invalidRequestMessage = createMessageWithOutData("error:mustJoinBefore");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      const broadcastJoinMessage = createMessage<BroadcastChatMessageData>(
        "broadcast:chat",
        {
          id: currentUser.client.id,
          text: requestData.text,
          imageUrl: requestData.imageUrl
        }
      );
      broadcastMessage(wss, broadcastJoinMessage);
    }
    else if (requestBody.message === "msg:to:chat")
    {
      const requestData = requestBody.data as MsgToChatMessageData;
      if (!requestData.id)
      {
        console.error(`there's no id in to chat message`);
        const invalidRequestMessage = createMessageWithOutData("error:invalidReq");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      if (!requestData.text && !requestData.imageUrl)
      {
        console.error(`there's no text of image in chat message`);
        const invalidRequestMessage = createMessageWithOutData("error:invalidReq");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      const currentUsers = users.val();
      const currentUser = _.find(currentUsers, (user) => user.client.id === ws.id);
      const targetUser = _.find(currentUsers, (user) => user.client.id === requestData.id);

      if (!currentUser || !currentUser.client.id)
      {
        console.warn(`there's no user of #${ws.id}`);
        const invalidRequestMessage = createMessageWithOutData("error:mustJoinBefore");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }

      if (!targetUser)
      {
        console.error(`there's no user of ${requestData.id} in data`);
        const invalidRequestMessage = createMessageWithOutData("error:invalidReq");
        return ws.send(JSON.stringify(invalidRequestMessage));
      }


      const replyToChatMessageData = createMessage<ReplyToChatMessageData>(
        "reply:to:chat",
        {
          id: currentUser.client.id,
          text: requestData.text,
          imageUrl: requestData.imageUrl
        }
      );

      targetUser.client.send(JSON.stringify(replyToChatMessageData));
    }
  });

  ws.on("close", function onClose()
  {
    const currentUsers = users.val();
    const currentUser = _.find(currentUsers, (user) => user.client.id === ws.id);
    const userId = currentUser?.client.id;
    users.update((oldValue) => _.filter(oldValue, (user) => ws.id !== user.client.id));

    if (!userId)
      return console.error(`It can't be happened! there's no data of #${userId}`);

    console.info(`#${userId} will be closed`);

    const broadcastLeaveMessage = createMessage<BroadcastLeaveMessageData>(
      "broadcast:leave",
      {
        id: userId,
        description: `#${userId} has left the server...`
      }
    );
    broadcastMessage(wss, broadcastLeaveMessage);
  });
});

app.get('/test', (_, res) =>
{
  res.sendFile(path.join(__dirname, '/test.html'));
});

app.get('/hi', (_, res) =>
{
  res.status(200).send("마이크 테스트");
});

app.get('/user', (_, res) =>
{
  const response: UserResponseBody[] = users.val()
    .filter(user => user.client.id)
    .map(user => (
      {
        id: user.client.id ?? "",
        name: user.name,
        joinedDateTime: user.joinedDateTime
      }
    )
    );
  res.status(200).json({ data: response });
});

//404
app.use(function RouteNotFound(req, res, next)
{
  next(httpErrors(404, `${req.originalUrl} Can't be Found`));
});

//global error handler for http routes
app.use(function HandleErrors(err, req, res, next) 
{
  const resBody = {};
  if (err instanceof HttpError)
  {
    const resBody = {
    } as { message?: string; };

    if (err.expose)
      resBody.message = err.message;
  }

  res.status(err.status || 500);
  res.send(resBody);
} as ErrorRequestHandler);

export async function start()
{
  try
  {
    server.listen(port, () =>
    {
      console.log(`listening on ${port}`);
    });
  }
  catch (err)
  {
    let message = "";
    if (err instanceof Error)
    {
      message = formatError(err);
    }
    console.error(message);
  }
}

function formatError(err: Error)
{
  return `name : ${err.name} / message : ${err.message}`;
}

function createMessageWithOutData<T>(message: MessageType): MessageOnly
{
  return { message, date: new Date() };
}

function createMessage<T>(message: MessageType, data: T): Message<T>
{
  return { message, data, date: new Date() };
}

function createMessageFromWsData<T>(data: WebSocket.RawData): Message<T> | null
{
  try
  {
    const result = JSON.parse(data.toString());
    return result;
  } catch (err)
  {
    return null;
  }
}

function getWsClient(wss: WebSocket.Server<WebSocket.WebSocket>, id: string): WebSocketWithId | null
{
  let result = null;
  wss.clients.forEach((client: WebSocketWithId) =>
  {
    if (client.id === id)
      result = client;
  });
  return result;
}

function broadcastMessage<T>(wss: WebSocket.Server<WebSocket.WebSocket>, message: Message<T>)
{
  wss.clients.forEach(function each(client)
  {
    if (client.readyState === WebSocket.OPEN)
    {
      client.send(JSON.stringify(message),);
    }
  });
}