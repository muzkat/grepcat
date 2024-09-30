class GrepcatArchiver {
    constructor(build) {
        this.foo = build.foo;
    }
    log(){
        console.log(this.foo);
    }
    static get Builder() {
        class Builder {
            constructor(foo) {
                this.foo = foo;
            }
            build() {
                return new GrepcatArchiver(this);
            }
        }
        return Builder;
    }
}

module.exports = GrepcatArchiver;