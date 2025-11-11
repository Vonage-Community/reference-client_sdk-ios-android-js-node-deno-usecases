//
//  NetworkService.swift
//  VonageSDKClientVOIPExample
//
//  Created by Mehboob Alam on 27.06.23.
//

import Foundation
import Combine

/// Service responsible for making network requests
/// Uses Combine to provide reactive network calls
class NetworkService {
    
    /// Sends a network request and decodes the response
    /// - Parameter apiType: The API endpoint configuration
    /// - Returns: A publisher that emits the decoded response or an error
    func sendRequest<T: Decodable>(apiType: any ApiType) -> AnyPublisher<T, Error> {
        var request = URLRequest(url: apiType.url)
        request.httpMethod = apiType.method
        request.allHTTPHeaderFields = apiType.headers
        
        if let body = apiType.body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: error).eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared
            .dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200..<300).contains(httpResponse.statusCode) else {
                    if let error = try? JSONSerialization.jsonObject(with: data) {
                        print("Server error: \(error)")
                    }
                    throw URLError(.badServerResponse)
                }
                return data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}
