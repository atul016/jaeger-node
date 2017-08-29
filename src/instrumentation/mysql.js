const opentracing = require('opentracing')
const shimmer = require('shimmer')
const cls = require('../cls')


const DB_TYPE = 'mysql'
const OPERATION_NAME = 'mysql'

function patch (mysql, tracer) {
  shimmer.wrap(mysql, 'createConnection', wrapCreateConnection)

  function wrapCreateConnection (original) {
    return function wrappedCreateConnection () {
      var connection = original.apply(this, arguments)

      wrapQueryable(connection, 'connection', tracer)

      return connection
    }
  }
}

function unpatch (mysql) {
  shimmer.unwrap(mysql, 'createConnection')
}

function wrapQueryable (obj, objType, tracer) {
  shimmer.wrap(obj, 'query', wrapQuery)
  function wrapQuery (original) {
    return function wrappedQuery (sql, values, cb) {
      const span = cls.startChildSpan(tracer, `${OPERATION_NAME}_query`)
      var hasCallback = false
      var sqlStr
      var row_count = 0
      span.setTag(opentracing.Tags.DB_TYPE, 'db.mysql.query')
      span.log({
            'sql': sql,
            'values': values,
            'cb': cb
          })
      switch (typeof sql) {
          case 'string':
            sqlStr = sql
            break
          case 'object':
            if (typeof sql._callback === 'function') {
              sql._callback = wrapCallback(sql._callback)
            }
            sqlStr = sql.sql
            break
          case 'function':
            arguments[0] = wrapCallback(sql)
            break
        }

        if (sqlStr) {
          span.setTag(opentracing.Tags.DB_STATEMENT, sqlStr)
        }
        if (typeof values === 'function') {
          arguments[1] = wrapCallback(values)
        } else if (typeof cb === 'function') {
          arguments[2] = wrapCallback(cb)
        }
      
      var result = original.apply(this, arguments)
      if (result && !hasCallback) {
        shimmer.wrap(result, 'emit', function (original) {
          return function (event, err) {
            switch (event) {
              case 'error':
                span.log({
                  event: 'error',
                  'error.object': err
                })
                span.setTag(opentracing.Tags.ERROR, true)
                span.finish()
              // end event is end of query if not callback
              case 'result':
                row_count = row_count+1;
              case 'end':
                span.log({
                  'result': row_count + ' rows selected'
                })
                span.finish()
            }
            return original.apply(this, arguments)
          }
        })
      }

      return result
      //wraping the callback
      function wrapCallback (cb) {
        hasCallback = true
        return function wrappedCallback (error, results, fields) {
          if (error) {
              span.log({
              event: 'error',
              'error.object': error
              })
            span.setTag(opentracing.Tags.ERROR, true)
          }
          if (results) {
              span.log({
              'result': results.length + ' rows selected'
              })
          }
          span.finish()
          return cb.apply(this, arguments)
        }
      }
    }
  }
}

module.exports = {
  module: 'mysql',
  supportedVersions: ['2.x'],
  OPERATION_NAME,
  patch,
  unpatch
}
