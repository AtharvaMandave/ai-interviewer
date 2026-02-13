/**
 * Standard API Response structure
 */
class ApiResponse {
    constructor(success, data = null, message = null, meta = null) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }

    static success(data, message = 'Success', meta = null) {
        return new ApiResponse(true, data, message, meta);
    }

    static error(message, data = null) {
        return new ApiResponse(false, data, message);
    }

    static paginated(data, page, limit, total) {
        return new ApiResponse(true, data, 'Success', {
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    }
}

module.exports = { ApiResponse };
