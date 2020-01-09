import Hashes from 'jshashes';
import lodash from 'lodash';

class Socket {
    constructor (scoketUrl) {
        this.scoket_url = scoketUrl;
        this.opencall = [];// 链接成功回调
        this.wsmessage = {};// 一次性消息回调
        this.wsmessageon = {};// 监听消息回调
        this.wsmessagee = {};// 一次性错误回调
        this.wsmessageeon = {};// 监听错误回调
        this.isre = true;
        this.reconnect();
    }

    /**
     * 设置自动重连状态
     * @param re
     */
    setre (re = true) {
        this.isre = re;
    }

    /**
     * 重新链接
     */
    reconnect () {
        this.wsServer = new WebSocket(this.scoket_url);
        this.wsServer.onopen = () => {
            // Web Socket 已连接上，使用 send() 方法发送数据
            console.log('Web Socket 已连接上');
            if (this.opencall.length > 0) {
                lodash.each(this.opencall, (function1) => {
                    function1();
                });
            }
        };
        this.wsServer.onclose = () => { // 当链接关闭的时候触发
            console.log('连接已关闭');
            if (this.isre) {
                // 自动重连
                setTimeout(() => {
                    this.reconnect();
                }, 1000);
            }
        };
        this.wsServer.onerror = () => {
            // 错误情况触发
            console.log('Web Socket 发生错误!');
            if (this.isre) {
                // 自动重连
                setTimeout(() => {
                    this.reconnect();
                }, 1000);
            }
        };
        this.wsServer.onmessage = (d) => {
            const resData = JSON.parse(d.data);
            console.log(resData, 37);
            if (resData.e) {
                this.error(resData);
            } else {
                this.success(resData);
            }
        };
    }

    success (resData) {
        console.log('success', resData, this.wsmessage, this.wsmessageon);
        if (typeof this.wsmessage[resData.p] === 'function') {
            // 一次性
            const fun = this.wsmessage[resData.p];
            delete this.wsmessage[resData.p];
            fun(resData);
        }
        if (typeof this.wsmessageon[resData.p] === 'function') {
            // 持久监听
            this.wsmessageon[resData.p](resData);
        }
    }

    error (resData) {
        console.log('error', resData);
        if (typeof this.wsmessagee[resData.p] === 'function') {
            // 一次性
            const fun = this.wsmessagee[resData.p];
            delete this.wsmessagee[resData.p];
            fun(resData);
        }
        if (typeof this.wsmessageeon[resData.p] === 'function') {
            // 持久监听
            this.wsmessageeon[resData.p](resData);
        }
    }

    /**
     * 增加链接开启回调函数
     * @param callfunc
     */
    addopen (callfunc) {
        this.opencall.push(callfunc);
    }

    /**
     * 发送且一次性监听
     * @param mt
     * @param d
     * @param res
     * @param error
     * @param p
     */
    send (mt, d, res = false, error = false) {
        // 发送消息并绑定回调函数
        const MD5 = new Hashes.MD5();
        const p = MD5.hex(mt + JSON.stringify(d) + new Date().getTime());
        mt = mt.split('@');
        var data = {
            s: mt[0],
            r: mt[1],
            d: d,
            p: p
        };
        try {
            data = JSON.stringify(data);
        } catch (err) {
            console.log('必须是json格式');
            return false;
        }
        this.wsmessage[p] = res;
        this.wsmessagee[p] = error;
        if (this.wsServer.readyState === 1) {
            this.wsServer.send(data);
        } else {
            this.addopen(() => {
                this.wsServer.send(data);
            });
        }
    }

    /**
     * 发送并持续监听
     * @param mt
     * @param d
     * @param p
     * @param res
     * @param error
     */
    sendon (mt, d, p, res = false, error = false) {
        // 发送消息并绑定回调函数
        mt = mt.split('@');
        var data = {
            s: mt[0],
            r: mt[1],
            d: d,
            p: p
        };
        try {
            data = JSON.stringify(data);
        } catch (err) {
            console.log('必须是json格式');
            return false;
        }
        this.wsmessageon[p] = res;
        this.wsmessageeon[p] = error;
        if (this.wsServer.readyState === 1) {
            this.wsServer.send(data);
        } else {
            this.addopen(() => {
                this.wsServer.send(data);
            });
        }
    }

    /**
     * 增加监听事件
     * @param p 事件名字
     * @param res 成功的回调
     * @param error 失败的回调
     *
     */
    addon (p, res = false, error = false) {
        this.wsmessageon[p] = {
            type: 1,
            fun: res
        };
        this.wsmessageeon[p] = {
            type: 1,
            fun: error
        };
    }
}

export default Socket;
