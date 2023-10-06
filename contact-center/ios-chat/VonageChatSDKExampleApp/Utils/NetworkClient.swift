//
//  NetworkClient.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 11.06.23.
//

import Foundation
import Combine

class NetworkClient {    
    func sendRequest<type: Decodable>(apiType: any ApiType) -> AnyPublisher<type, Error> {
        guard let url = URL(string: apiType.url) else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        var request = URLRequest(url: url)
        request.httpMethod = apiType.method
        request.allHTTPHeaderFields = apiType.headers
        do {
            if let body = apiType.body {
                request.httpBody = try JSONEncoder().encode(body)
            }
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        return URLSession
            .shared
            .dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse,
                      200..<300 ~= httpResponse.statusCode else {
                    throw URLError(.badServerResponse)
                }
                return data
            }
            .decode(type: type.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}
