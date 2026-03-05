import Foundation
import Capacitor
import StoreKit

@objc(BlocktopiaIAPPlugin)
public class BlocktopiaIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BlocktopiaIAP"
    public let jsName = "BlocktopiaIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchaseNoAdsLifetime", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restoreNoAdsPurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNoAdsStatus", returnType: CAPPluginReturnPromise)
    ]

    private let defaultProductId = "blocktopia.no_ads_lifetime"
    private let unlockedKey = "blocktopia.noads.unlocked"

    @objc func purchaseNoAdsLifetime(_ call: CAPPluginCall) {
        let productId = getProductId(from: call)
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try checkVerified(verification)
                    setUnlocked(true)
                    await transaction.finish()
                    call.resolve([
                        "purchased": true,
                        "noAdsUnlocked": true,
                        "productId": transaction.productID
                    ])
                case .pending:
                    call.resolve([
                        "purchased": false,
                        "pending": true,
                        "noAdsUnlocked": isUnlocked()
                    ])
                case .userCancelled:
                    call.resolve([
                        "purchased": false,
                        "cancelled": true,
                        "noAdsUnlocked": isUnlocked()
                    ])
                @unknown default:
                    call.reject("Unknown purchase state")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restoreNoAdsPurchases(_ call: CAPPluginCall) {
        let productId = getProductId(from: call)
        Task {
            do {
                try await AppStore.sync()
                let unlocked = await refreshUnlockedStatus(productId: productId)
                call.resolve([
                    "restored": unlocked,
                    "noAdsUnlocked": unlocked
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func getNoAdsStatus(_ call: CAPPluginCall) {
        let productId = getProductId(from: call)
        Task {
            let unlocked = await refreshUnlockedStatus(productId: productId)
            call.resolve([
                "noAdsUnlocked": unlocked
            ])
        }
    }

    private func getProductId(from call: CAPPluginCall) -> String {
        let raw = call.getString("productId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return raw.isEmpty ? defaultProductId : raw
    }

    private func setUnlocked(_ value: Bool) {
        UserDefaults.standard.set(value, forKey: unlockedKey)
    }

    private func isUnlocked() -> Bool {
        UserDefaults.standard.bool(forKey: unlockedKey)
    }

    private func refreshUnlockedStatus(productId: String) async -> Bool {
        do {
            for await entitlement in Transaction.currentEntitlements {
                let transaction = try checkVerified(entitlement)
                if transaction.productID == productId {
                    setUnlocked(true)
                    return true
                }
            }
            setUnlocked(false)
            return false
        } catch {
            return isUnlocked()
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified:
            throw NSError(
                domain: "BlocktopiaIAP",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Transaction verification failed"]
            )
        }
    }
}
