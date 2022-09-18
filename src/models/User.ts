import { WebSocketWithId } from "src/typedef";

export default interface User
{
  client: WebSocketWithId;
  name: string;
  joinedDateTime: Date;
}