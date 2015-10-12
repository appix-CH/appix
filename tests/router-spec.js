'use strict';

describe('router', () => {

    class RouteRule {
        parseRequest() {}
        createUrl() {}
    }

    let di = require('../');
    let logger = {
        info: () => {
        }
    };
    let component = {
        get: key => {
            if (key === 'en/logger') {
                return logger;
            }
        }
    };
    let Router = di.mock('@{en}/router', {
        '@{en}/route-rule': RouteRule,
        'en/component': component,
        '@{en}/error': di.load('@{en}/error'),
        'typed-js': di.load('typed-js')
    });
    let routerInstance;

    beforeEach(() => {
        routerInstance = new Router();
    });

    it('constructs', () => {

        spyOn(logger, 'info').and.callThrough();
        routerInstance = new Router({
            url: '/error',
            route: 'error/handler',
            errorRoute: 'error/handle',
            useCustomErrorHandler: true
        });
        expect(routerInstance.errorRoute).toBe('error/handle');
        expect(logger.info).toHaveBeenCalled();
        routerInstance = new Router({
            url: '/error-1',
            route: 'test/handler',
            errorRoute: 'test/handler',
            useCustomErrorHandler: true
        });
        expect(routerInstance.errorRoute).toBe('test/handler');

        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        expect(routerInstance.errorRoute).toBe('error/handler');

    });

    it('add', () => {
        let route = {
            url: '/home',
            route: 'home/index'
        };
        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        spyOn(logger, 'info').and.callThrough();
        routerInstance.add(route);
        expect(logger.info).toHaveBeenCalledWith('Router.add', new RouteRule(route));
        expect(routerInstance.routes.size).toBe(1);

        routerInstance.add([route, route]);
        expect(routerInstance.routes.size).toBe(3);

        let error;
        try {
            routerInstance.add('abc');
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe('rule must be instance of RouteRule class');
        expect(error.code).toBe(500);

    });

    it('parseRequest error', (done) => {
        let route = {
            url: '/home',
            route: 'home/index'
        };
        spyOn(RouteRule.prototype, 'parseRequest').and.callThrough();
        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        routerInstance.add(route);

        return routerInstance
            .parseRequest('/home', 'GET')
            .catch((error) => {
                expect(error.message).toBe('Router.parseRequest: no request found');
                expect(error.code).toBe(404);
                expect(RouteRule.prototype.parseRequest).toHaveBeenCalledWith('/home', 'GET');
            })
            .catch(fail)
            .then(done);
    });

    it('parseRequest', (done) => {
        let route = {
            url: '/home',
            route: 'home/index'
        };
        spyOn(RouteRule.prototype, 'parseRequest').and.callThrough();
        RouteRule.prototype.parseRequest = () => {
            return Promise.resolve(true);
        };
        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        routerInstance.add(route);

        return routerInstance
            .parseRequest('/home', 'GET')
            .then(data => expect(data).toBe(true))
            .catch(fail)
            .then(done);
    });

    it('createUrl', (done) => {
        let route = {
            url: '/home',
            route: 'home/index'
        };
        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        routerInstance.add(route);
        RouteRule.prototype.createUrl = () => {
            return Promise.resolve('/home');
        };
        return routerInstance
            .createUrl('home/index', {})
            .then(data => {
                expect(data).toBe('/home');
                done();
            })
            .catch(fail)
            .then(done);
    });

    it('createUrl error', (done) => {
        let route = {
            url: '/home',
            route: 'home/index'
        };
        spyOn(RouteRule.prototype, 'createUrl').and.callThrough();

        routerInstance = new Router({
            useCustomErrorHandler: false
        });
        routerInstance.add(route);
        RouteRule.prototype.createUrl = () => {
            return Promise.resolve(false);
        };
        let params = new Map();
        params.set('q', 1);
        return routerInstance
            .createUrl('home/index', params)
            .then(data => expect(data).toBe('/home/index?q=1'))
            .catch(fail)
            .then(done);
    });

});