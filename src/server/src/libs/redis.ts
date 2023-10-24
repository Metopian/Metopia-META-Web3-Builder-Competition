import Redis from 'ioredis';
import _ from 'lodash';
import config from 'config'
const redisConfig = config.get("redis");
let redis = new Redis(redisConfig);;

export default redis