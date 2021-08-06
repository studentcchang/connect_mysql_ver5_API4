
var express = require("express");
const bodyParser = require("body-parser");
var jsonParser = bodyParser.json()
var app = express();
var moment=require('moment')
//var query = require('./db')
var querystring = require("querystring");

const num = 48;
var MachineStatus=[num];
for (i=0;i<num;i++){
  MachineStatus[i]=0;
}


var mysql = require('mysql');//引入資料庫驅動模組
//console.log(mysql)
// 連線資料庫的配置
var connection = mysql.createConnection({
  // 主機名稱，一般是本機
  host: '34.81.11.129',
  // 資料庫的埠號，如果不設定，預設是3306
  port: '3306',
  // 建立資料庫時設定使用者名稱
  user: 'eric',
  // 建立資料庫時設定的密碼
  password: '123456',
  // 建立的資料庫
  database: 'sakila'
});
// 與資料庫建立連線
connection.connect();
// 查詢資料庫
connection.query('SELECT * from factory', function (error, results, fields) {
  if (error) throw error;
  console.log(results);
});

var QueryDBTime = moment(moment.valueof).format('YYYY-MM-DD HH:mm:ss');

app.post('/queryStopEvent',jsonParser, function (req, res) {
  const id_num=parseInt(req.body.machineID.substring(1,4))
  if(id_num==null)
  {
    res.json({event:-1,status_code:400,msg:'API參數傳入錯誤'})
  }
  else{     
      var id_event=MachineStatus[id_num-1]
      MachineStatus[id_num-1]=0
      if (id_event == 1){
        res.json({event:1,status_code:200,msg:'讀取停機事件成功'});
        var sql = 'update factory set is_execution=True where is_execution=False and timestamp<=? and machine_id=?';
        var update_value = [QueryDBTime,req.body.machineID]
        connection.query(sql, update_value, function (err, result) {
            if (err) {
                console.log('修改資料失敗', err.message);
                res.json({event:-1,status_code:400,msg:'更新資料庫已讀狀態失敗'})
            }
        });
      }
      else{
        res.json({event:0,status_code:200,msg:'讀取停機事件成功'});
      }
  }
})



app.post('/setStopEvent',jsonParser,function (req, res) {
  //原本是put
  //處理請求修改的資料和條件
  //查詢引數解析
  const id_num=parseInt(req.body.machineID.substring(1,4))
  if(id_num==null)
  {
    res.json({status_code:400,msg:'API參數傳入錯誤'})
  }
  else
  {
      var client_ip =(req.headers["x-forwarded-for"] || "").split(",").pop() || req.remoteAddress || req.socket.remoteAddress || req.socket.remoteAddress;
      var sql = 'INSERT INTO factory(machine_id,is_execution,timestamp,operating_ip) values (?,0,?,?)'
      var update_value = [req.body.machineID,moment(moment.valueof).format('YYYY-MM-DD HH:mm:ss'),client_ip]
      connection.query(sql, update_value, function (err, result) {
          if (err) {
              console.log('修改資料失敗', err.message);
              res.json({status_code:400,msg:'設定停機失敗'})
          }
          //res.send(result) //   響應內容 修改資料成功
          res.json({status_code:200,msg:'設定停機成功'})
      });
  }
})

// 關閉連線
//connection.end();
//複製程式碼
var server = app.listen(8369, function () {
  console.log('server running at 8369 port')
})


function intervalFunc() {
  QueryDBTime=moment(moment.valueof).format('YYYY-MM-DD HH:mm:ss');
  var sql = 'select machine_id from factory where is_execution=False and timestamp<=?';
  var where_value=[QueryDBTime]
  connection.query(sql, where_value, function (err, result) {
      if (err) {
          console.log('[SELECT ERROR]:', err.message);
      }  
      //console.log(result);
      var id =0;
      for(i=0;i<result.length;i++)
      {
        id = parseInt(result[i].machine_id.substring(1,4));
        MachineStatus[id-1]=1;
      }
      console.log( MachineStatus);
  })
}
setInterval(intervalFunc, 3000);
