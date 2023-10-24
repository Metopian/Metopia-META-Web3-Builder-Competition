// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

library Utils {
    function max(uint a, uint b) public pure returns (uint256) {
        if (a >= b) {
            return a;
        } else {
            return b;
        }
    }
}
