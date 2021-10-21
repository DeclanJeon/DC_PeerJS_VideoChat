function fileSharing(userId) {
    let connection = new DataConnection();
    console.log("connection 진입 :::::" + connection);
    connection.userid = username;
    console.log("connection userID :::: " + connection.userid);

    connection.check(ROOM_ID);
    console.log("file share connection Check : " + connection.check(ROOM_ID));
}
