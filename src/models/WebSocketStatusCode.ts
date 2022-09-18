enum WebSocketStatusCode
{
  NormalClosure = 1000,
  GoingAway = 1001,
  ProtocolError = 1002,
  UnsupportedData = 1003,
  Reserved = 1004,
  NoStatusRcvd = 1005,
  AbnormalClosure = 1006,
  InvalidFramePlayloadData = 1007,
  PolicyViolation = 1008,
  MessageTooBig = 1009,
  MandatoryExt = 1010,
  InternalError = 1011,
  ServiceRestart = 1012,
  TryAgainLater = 1013,
  BadGateway = 1014,
  TlsHandshake = 1015,
  Unauthorized = 3000
}

export default WebSocketStatusCode;