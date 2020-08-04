import { random } from 'lodash';
import { Request } from 'express';
class SessionSecurity {
    private lastId = random(1000,2000)
    private sessionMap = new Map<number, string>();

    add(token:string) {
        const id = ++this.lastId;
        this.sessionMap.set(id, token);
        return id;
    }
    remove(id: number, token:string){
        if (this.equal(id, token)) {
            this.sessionMap.delete(id);
            return true;
        }
        return false;
    }
    equal(id:number, token:string){
        const storedToken = this.sessionMap.get(id);
        return storedToken === token;
    }

    removeToken(token:string){
        let removed = 0;  
        this.sessionMap.forEach((value, key)=>{
            if (value === token){
                this.sessionMap.delete(key);
                removed++;
            }
        });
        return removed;
    }

    getToken(req:Request) {
        const id = req.session.token;
        if (!id) return undefined;
        return this.sessionMap.get(id);
    }
}

export const sessionSecurity = new SessionSecurity();