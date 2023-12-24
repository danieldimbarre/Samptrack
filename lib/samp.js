const dgram = require('dgram')
const dns = require('dns')

const safeRequest = function (ipaddress, port, opcode, safeResponse) {
  if (validateIPAddress(ipaddress)) {
    request(ipaddress, port, opcode, function (error, response) { safeResponse.apply(ipaddress, [error, response]) })
  } else {
    dns.lookup(ipaddress, function (err, result) {
      if (err) safeResponse.apply(ipaddress, [err, result])
      request(ipaddress, port, opcode, function (error, response) { safeResponse.apply(ipaddress, [error, response]) })
    })
  }
}

var request = function (ipaddress, port, opcode, response) {
  const socket = dgram.createSocket('udp4')
  const packet = Buffer.alloc(10 + opcode.length)

  packet.write('SAMP')
  packet[4] = ipaddress.split('.')[0]
  packet[5] = ipaddress.split('.')[1]
  packet[6] = ipaddress.split('.')[2]
  packet[7] = ipaddress.split('.')[3]
  packet[8] = port & 0xFF
  packet[9] = port >> 8 & 0xFF
  packet[10] = opcode.charCodeAt(0)

  try {
    socket.send(packet, 0, packet.length, port, ipaddress, function (error, bytes) {
      if (error) {
        console.log(error)
        return -1
      }
    })
  } catch (error) { console.log(error); return -1 }

  const controller = setTimeout(function () {
    socket.close()
    return response.apply(ipaddress, [true, '[error] host unavailable - ' + ipaddress + ':' + port])
  }, 2000)

  socket.on('message', function (message) {
    if (controller) clearTimeout(controller)
    if (message.length < 11) {
      response.apply(ipaddress, [true, '[error] invalid socket on message - ' + message])
    } else {
      socket.close()
      message = message.slice(11)

      let offset = 0; let object = {}

      if (opcode === 'i') {
        object.passworded = !!message.readUInt8(offset)
        object.players = message.readUInt16LE(offset += 1)
        object.maxplayers = message.readUInt16LE(offset += 2)

        object.servername = message.readUInt16LE(offset += 2)
        object.servername = message.slice(offset += 4, offset += object.servername).toString()

        object.gamemodename = message.readUInt16LE(offset)
        object.gamemodename = message.slice(offset += 4, offset += object.gamemodename).toString()

        object.language = message.readUInt16LE(offset)
        object.language = message.slice(offset += 4, offset += object.language).toString()
        return response.apply(ipaddress, [false, object])
      } else if (opcode === 'r') {
        const propertiescount = message.readUInt16LE(offset); offset += 2

        for (var i = 0; i < propertiescount; i++) {
          let property = message.readUInt8(offset)
          property = message.slice(++offset, offset += property).toString()

          let propertyvalue = message.readUInt8(offset)
          propertyvalue = message.slice(++offset, offset += propertyvalue).toString()

          object[property] = propertyvalue
        }
        return response.apply(ipaddress, [false, object])
      } else if (opcode === 'd') {
        object = []

        var playercount = message.readUInt16LE(offset); offset += 2

        for (var f = 0; f < playercount; f++) {
          playercount--
          var player = {}

          player.id = message.readUInt8(offset)
          player.name = message.readUInt8(++offset)
          player.name = message.slice(++offset, offset += player.name).toString()
          player.score = message.readUInt16LE(offset)
          player.ping = message.readUInt16LE(offset += 4)
          offset += 4

          object.push(player)
        }
        return response.apply(ipaddress, [false, object])
      } else if (opcode === 'c') {
        object = []

        var playercountC = message.readUInt16LE(offset); offset += 2

        for (var g = 0; g < playercountC; g++) {
          playercountC--
          var playerC = {}

          playerC.name = message.readUInt8(offset)
          playerC.name = message.slice(++offset, offset += playerC.name).toString()
          playerC.score = message.readUInt16LE(offset)
          offset += 4

          object.push(playerC)
        }
        console.log(object)
        return response.apply(ipaddress, [false, object])
      }
    }
  })
}

function validateIPAddress (ipaddress) {
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) return true
  return false
}

const getServerInfo = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    const serverinfo = response

    safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
      if (error) return reply.apply(serverip, [true, response])
      serverinfo.properties = response

      if (parseInt(serverinfo.players) < 100) {
        safeRequest.call(this, serverip, serverport, 'd', function (error, response) {
          if (error) return reply.apply(serverip, [true, response])
          serverinfo.playerlist = response

          return reply.apply(serverip, [false, serverinfo])
        })
      } else return reply.apply(serverip, [false, serverinfo])
    })
  })
}

const getServerProperties = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response])
  })
}

const getServerOnline = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, parseInt(response.players)])
  })
}

const getServerMaxPlayers = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, parseInt(response.maxplayers)])
  })
}

const getServerName = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.servername])
  })
}

const getServerGamemodeName = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.gamemodename])
  })
}

const getServerLanguage = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.language])
  })
}

const getServerVersion = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.version])
  })
}

const getServerWeather = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.weather])
  })
}

const getServerWebSite = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.weburl])
  })
}

const getServerWorldTime = function (serverip, serverport, reply) {
  safeRequest.call(this, serverip, serverport, 'r', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, response.worldtime])
  })
}

const getServerPlayers = function (serverip, serverport, reply) {
  getServerOnline.call(this, serverip, serverport, function (error, response) {
    if (!isFinite(response) || response > 100 || error) return reply.apply(serverip, [true, '[error] more 100 players on server'])

    safeRequest.call(this, serverip, serverport, 'c', function (error, response) {
      if (error) return reply.apply(serverip, [true, response])
      return reply.apply(serverip, [false, response])
    })
  })
}

const getServerPlayersDetailed = function (serverip, serverport, reply) {
  getServerOnline.call(this, serverip, serverport, function (error, response) {
    if (!isFinite(response) || response > 100 || error) return reply.apply(serverip, [true, '[error] more 100 players on server'])

    safeRequest.call(this, serverip, serverport, 'd', function (error, response) {
      if (error) return reply.apply(serverip, [true, response])
      return reply.apply(serverip, [false, response])
    })
  })
}

const getServerPing = function (serverip, serverport, reply) {
  const timenow = new Date().getTime()

  safeRequest.call(this, serverip, serverport, 'i', function (error, response) {
    if (error) return reply.apply(serverip, [true, response])
    return reply.apply(serverip, [false, new Date().getTime() - timenow])
  })
}

function callWithTimeout (func, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout)
    func().then(
      response => resolve(response),
      err => reject(new Error(err))
    ).finally(() => clearTimeout(timer))
  })
}

module.exports = {
  getServerInfo,
  getServerProperties,
  getServerOnline,
  getServerMaxPlayers,
  getServerName,
  getServerGamemodeName,
  getServerLanguage,
  getServerVersion,
  getServerWeather,
  getServerWebSite,
  getServerWorldTime,
  getServerPlayers,
  getServerPlayersDetailed,
  getServerPing,
  callWithTimeout
}
