import ActivityKit

struct CallActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var progress: Double
    }
    var callId: String
}
