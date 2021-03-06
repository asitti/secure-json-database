"use strict";

var _ = require("lodash"),
    fh = require("./Filehandler"),
    EventEmitter = require('events')


module.exports = class DB extends EventEmitter {
    constructor(args) {
        super()
        this.db = {}
        this.path = args.path
        this.key = args.key
        this.fileHandler = new fh({
            path: this.path,
            key: this.key
        })
        var data = this.fileHandler.init()
        if (data != null) {
            this.db = data
        }
    }

    changeKey(newKey) {
        if (this.key !== newKey) {
            this.key = this.fileHandler.genNewKey(newKey)
            this.update()
        }
    }

    addTable(name) {
        if (this.db[name] === undefined) {
            this.db[name] = []
            this.update()
        }
    }

    getAllTableNames() {
        return Object.keys(this.db)
    }

    getTable(name) {
        if (this.db[name] == undefined) {
            return
        }
        return this.db[name]
    }

    insert(tablename, data) {
        try {
            if (data != undefined) {
                if (this.db[tablename] != undefined) {
                    
                    var isInDB = _.filter(this.db[tablename], {
                        id: data.id
                    })
                    if (isInDB[0] !== undefined) {
                        return false
                    }
                    
                    if(!data.id){
                        data.id = this.genUUID()
                    }
                    this.db[tablename].push(data)
                    //event emiter
                    this.emit("insert", tablename, data)
                    this.update()
                    return true
                } else {
                    throw new Error("Table wasn't created")
                }
            } else {
                console.error("Error: Data was null or undefined!")
                return
            }
        } catch (err) {
            console.log(err)
        }
    }

    removeAllBy(tablename, args) {
        if (this.db[tablename] != undefined) {
            var removed = this.findAll(tablename, args)
            _.pullAllBy(this.db[tablename], removed)
            //event emiter
            this.emit("delete", tablename, removed)
            this.update()
        } else {
            throw new Error("Table wasn't created")
        }
    }

    updateByID(tablename, id, data) {
        if (data != undefined) {
            if (this.db[tablename] != undefined) {
                var updated = _.filter(this.db[tablename], {
                    id: id
                })
                if (updated[0] === undefined) {
                    return
                }
                const index = _.sortedIndexBy(this.db[tablename], updated[0])
                Object.assign(this.db[tablename][index], data)
                //event emiter
                this.emit("updated", tablename, this.db[tablename][index])
                this.update()
            } else {
                throw new Error("Table wasn't created")
            }
        } else {
            console.error("Error: Data was null or undefined!")
            return
        }
    }

    find(tablename, args) {
        if (this.db[tablename] != undefined) {
            return _.find(this.getTable(tablename), args)
        } else {
            throw new Error("Table wasn't created")
        }
    }

    findLast(tablename, args) {
        if (this.db[name] != undefined) {
            return _.findLast(this.getTable(tablename), args)
        } else {
            throw new Error("Table wasn't created")
        }
    }

    findAll(tablename, args) {
        if (this.db[tablename] != undefined) {
            return _.filter(this.getTable(tablename), args)
        } else {
            throw new Error("Table wasn't created")
        }
    }

    genUUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    update() {
        this.fileHandler.write(this.db)
        this.emit("write")
    }
}