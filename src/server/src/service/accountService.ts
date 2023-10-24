import Account from "../model/account";

class AccountService {
    static selectAccountByOwner = (owner) => {
        return Account.findOne({ where: { owner } })
    }
    static selectAccountByReferralCode = (referralCode) => {
        return Account.findOne({ where: { referralCode } })
    }
}
export default AccountService