// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IPriceOracle.sol";

contract PriceOracle is Ownable, IPriceOracle {
    uint private _annualFee;

    constructor(uint annualFee_) {
        _annualFee = annualFee_;
    }

    function getAnnualFee(
        uint numYears
    ) external view override returns (uint res) {
        return _annualFee * numYears;
    }

    function setAnnualFee(uint annualFee_) public onlyOwner {
        _annualFee = annualFee_;
    }
}
