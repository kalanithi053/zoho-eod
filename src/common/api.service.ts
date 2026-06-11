import { Injectable } from "@nestjs/common";
import axios, { AxiosRequestConfig, Method } from "axios";
export interface RequestOptions {
  url: string;
  method: Method;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  bearerToken?: string;
}

@Injectable()
export class ApiService {
  async request<T = any>({
    url,
    method,
    params,
    data,
    headers = {},
    bearerToken,
  }: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      url,
      method,
      params,
      data,
      headers: {
        ...headers,
        ...(bearerToken && {
          Authorization: `Bearer ${bearerToken}`,
        }),
      },
    };

    const response = await axios(config);

    return response.data;
  }
}
