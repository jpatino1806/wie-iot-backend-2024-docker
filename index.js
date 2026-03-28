require('dotenv').config();
global.functions = require('./functions');
const express = require("express");
const app = express();
const routes = require("./routes");
const cors = require('cors');

////******************************* */
//importaciones despues del inicio del backend
const serverHttp = require('http').createServer();
const io = require('socket.io')(serverHttp, {
	cors: {
		origin: "*"
	}
});
const db = require('./models');
const mqtt = require('mqtt');

const Device = db.Device;
const DeviceData = db.DeviceData;

///******************************** */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(routes);

app.listen(process.env.API_PORT, () => {
	console.log(`Puerto API ${process.env.API_PORT}`);
});

//implementacion del websocket
const socket = io.on('connection', (ioSocket)=> {
	console.log(`Se establecio conexion con el websocket, puerto: ${process.env.WEBSOCKET_PORT}`);

	//creacion de un socket
	ioSocket.on('devices', async (data) => {
		console.log('Se recibe la key: ', data);

		const connectedDevice =  await Device.findOne({
			where: {
				key: data,
			}
		});
		if (connectedDevice) {
			console.log(`Conectado al dispositivo: ${connectedDevice.key}`);
			
			//socket.join crea la room
			//nombre de la "room" para poder enviarlos mensajes 
			//o datos al dispositivo especifico
			socket.join(`dispositivo-${connectedDevice.id}`);

		}else{
			console.log('no se encontro el dispositivo');
		}
	});
});

serverHttp.listen(process.env.WEBSOCKET_PORT);

///************************************** */
/****** implementacion del brocker ********/

const mqttClient = mqtt.connect('http://emqx');

mqttClient.on('connect', () => {
	console.log('Se conecto a mqtt');
});

//topic: /dispositivos/agtjkas
mqttClient.subscribe('/dispositivos/+');

//topic = /dispositivos/agtjkas
//message = {"temperatura": 35}
mqttClient.on('message', async (topic, message)=> {
	
	//obteniendo la key de topic
	const deviceKey = topic.split('/')[2];
	console.log(`Dispositivo ${deviceKey} publicando`);

	//se verifica que el disposito exista en base de datos
	const connectedDevice =  await Device.findOne({
			where: {
				key: deviceKey,
			}
	});

	if (connectedDevice) {
		//se transforma los datos a un objeto JSON valido
		const data = JSON.parse(message.toString());

		//query para guardar los datos recibidos de la tabla devices_data
		await DeviceData.create({
			device_id: connectedDevice.id,
			topic: topic,
			data: message.toString()
		});

		//asi como se creo la room con socket.join, ahora enviamos datos 
		//con socket.in a travez de la room que creamos 
		socket.in(`dispositivo-${connectedDevice.id}`).emit('temperatura', {date: Date(), value: data.temperatura});
		socket.in(`dispositivo-${connectedDevice.id}`).emit('luminosidad', {value: data.luminosidad});
		

	}
});
