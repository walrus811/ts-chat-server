export default interface Message<T>
{
  message: MessageType,
  data: T;
  date: Date;
}

export type MessageOnly = Pick<Message<undefined>, "message" | "date">;

export interface MsgWelcomeMessageData
{
  id: string;
}

export interface MsgJoinMessageData
{
  name: string;
  rejoin?: boolean;
}

export interface BroadcastJoinMessageData
{
  id: string,
  description: string;
  rejoin?: boolean;
}

export interface BroadcastLeaveMessageData
{
  id: string;
  description: string;
}

export interface BroadcastChatMessageData
{
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface MsgChatMessageData
{
  text?: string;
  imageUrl?: string;
}

export interface MsgToChatMessageData
{
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface ReplyToChatMessageData
{
  id: string;
  text?: string;
  imageUrl?: string;
}

export type MessageType =
  "msg:join" |
  "msg:chat" |
  "msg:to:chat" |
  "broadcast:join" |
  "broadcast:leave" |
  "broadcast:chat" |
  "reply:welcome" |
  "reply:joined" |
  "reply:to:chat" |
  "error:invalidReq" |
  "error:mustJoinBefore";