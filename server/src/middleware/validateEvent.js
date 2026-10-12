/**
 * Validates incoming event payload for POST /api/events
 */
function validateEvent(req, res, next) {
  // Support both camelCase and snake_case payload conventions
  const sessionId = req.body.sessionId || req.body.session_id;
  const eventType = req.body.eventType || req.body.event_type;
  const pageUrl = req.body.pageUrl || req.body.page_url;
  const timestamp = req.body.timestamp;
  
  // Coordinates can arrive as { coordinates: { x, y } } or direct { x, y } / { click_x, click_y }
  let coordinates = req.body.coordinates;
  if (!coordinates && (typeof req.body.x === 'number' || typeof req.body.click_x === 'number')) {
    coordinates = {
      x: req.body.x !== undefined ? req.body.x : req.body.click_x,
      y: req.body.y !== undefined ? req.body.y : req.body.click_y,
    };
  }

  // Check required string fields
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "sessionId" / "session_id". Must be a non-empty string.',
    });
  }

  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "eventType" / "event_type". Must be "page_view" or "click".',
    });
  }

  const validTypes = ['page_view', 'click'];
  if (!validTypes.includes(eventType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid "eventType": "${eventType}". Allowed values are: ${validTypes.join(', ')}.`,
    });
  }

  if (!pageUrl || typeof pageUrl !== 'string' || !pageUrl.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "pageUrl" / "page_url". Must be a non-empty string.',
    });
  }

  // Validate coordinates if eventType is 'click'
  if (eventType === 'click') {
    if (
      !coordinates ||
      typeof coordinates !== 'object' ||
      typeof coordinates.x !== 'number' ||
      isNaN(coordinates.x) ||
      typeof coordinates.y !== 'number' ||
      isNaN(coordinates.y)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Event of type "click" requires valid numeric coordinates object with { x, y } properties.',
      });
    }
  }

  // Store normalized keys on req.body
  req.body.sessionId = sessionId.trim();
  req.body.eventType = eventType.trim();
  req.body.pageUrl = pageUrl.trim();
  req.body.coordinates = eventType === 'click' ? coordinates : null;

  // Validate timestamp if provided
  if (timestamp) {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid "timestamp" format. Must be an ISO-8601 string or numeric timestamp.',
      });
    }
    req.body.timestamp = parsedDate;
  }

  // Normalize coordinates for page_view
  if (eventType === 'page_view' && !coordinates) {
    req.body.coordinates = null;
  }

  next();
}

module.exports = validateEvent;
