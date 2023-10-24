import log4js from "log4js";
import path from "path";
const LEVEL = process.env.NODE_ENV === "production" ? "debug" : "debug";
const paths = [__dirname, "logs"];
if (process.env.pm_id) {
  paths.push(process.env.pm_id);
}

const LOG_PATH = path.join(...paths);
const numBackups = 180;
const OUTPUT = "output";
const logTypes = ["db", "biz"];
const defaultAppends = [OUTPUT];

log4js.addLayout("json", function (config) {
  return function (logEvent) {
    delete logEvent.context;
    if (logEvent.data instanceof Array) {
      logEvent.data = logEvent.data[0] || "";
    }
    let outputString = JSON.stringify(logEvent);
    return outputString;
  };
});
/**
 * 返回所有日志类型appends
 */
function _appenders() {
  let appenders = {};
  for (let item of logTypes) {
    appenders[item] = {
      type: "dateFile",
      filename: path.join(LOG_PATH, `${item}.log`),
      keepFileExt: true,
      numBackups,
      // compress: true
    };
  }
  return appenders;
}
/**
 * 返回所有日志类型categories
 */
function _categories() {
  let categories = {};
  for (let item of logTypes) {
    categories[item] = { appenders: [...defaultAppends, item], level: LEVEL };
  }
  return categories;
}
/**
 * 返回所有日志类型loggers
 */
function _loggers() {
  let loggers = {};
  for (let item of logTypes) {
    loggers[item] = log4js.getLogger(item);
  }
  return loggers;
}
/**
 * appenders
 * file 日志将会输出到指定的文件中。
 * (略)
 * dateFile 日志的滚动将根据配置的时间格式进行滚动而不是文件大小
 * type:'dateFile'
 * filename string 输出文件的名字
 * pattern(默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。
 * layout 默认是basic layout
 * daysToKeep integer（默认为0） - 如果此值大于零，则在日志滚动期间将删除早于该天数的文件。
 * keepFileExt （默认为false） - 在滚动日志文件时保留文件扩展名（file.log变为file.2017-05-30.log而不是file.log.2017-05-30
 * compress 对滚动的日志文件进行压缩
 */
log4js.configure({
  disableClustering: true,
  appenders: {
    [OUTPUT]: { type: "stdout" },
    ..._appenders()
  },
  /**
   * categories 也是一个map类型的数据，key是 category 的名字是一个字符串，value 是一个对象。
   * 常用属性
   * level 定义打印日志的级别
   * appenders 定义打印的appende
   */
  categories: {
    default: { appenders: [OUTPUT], level: "all" },
    ..._categories()
  }
});

// module.exports = {
//   ["default"]: log4js.getLogger(),
//   ..._loggers()
// };

export default log4js.getLogger()
